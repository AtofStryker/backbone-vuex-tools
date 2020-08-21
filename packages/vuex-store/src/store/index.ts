import Vuex, { Store } from "vuex";
import { isArray } from "lodash";
import ApiClient from "@atofstryker/json-api-client";
import BackboneReactivityAdapter from "@atofstryker/backbone-reactivity-adapter";
import ResourceFactory from '@atofstryker/pojo-model-factory-json-api'
import {
  ParsedResourceModel,
  LinkRelationship,
  ResourceModel,
} from "@atofstryker/json-api-types";
import includesFields from "./includes-fields";

enum StateMutationType {
  SET = "SET",
  DELETE = "DELETE",
}

export const buildRegisterStoreUpdateFunc = function (store: Store<any>) {
  return function (type: string, id: string | null, key: string, value: any) {
    store.commit("reactiveUpdate", {
      type,
      id,
      key,
      value,
    });
  };
};

export default function buildStore(
  apiClient: ApiClient,
  factory: ResourceFactory,
  backboneReactivityAdapter: BackboneReactivityAdapter<any, any, any>
) {
  const store = new Vuex.Store({
    state: {},
    getters: {
      getState: (state: any) => (type: string, id: string | null = null) => {
        id = id || String(id);

        const resource = state[type] ? state[type][id] : null;

        // if id passed in for lookup is null, see if a SINGLE value exists in the cache, and if so, return it.
        if (!resource && id === "null" && state[type]) {
          const keys = Object.keys(state[type]);
          return keys.length === 1 ? state[type][keys[0]] : null;
        }

        return resource;
      },
    },
    mutations: {
      setState(
        state: { [index: string]: any },
        options: {
          stateMutationType: StateMutationType;
          type: string;
          id: string | null;
          resource: any;
        } = {
          stateMutationType: StateMutationType.SET,
          type: "",
          id: null,
          resource: null,
        }
      ) {
        if (
          !options.type ||
          (!options.resource &&
            options.stateMutationType === StateMutationType.SET)
        ) {
          throw Error("no resource or type provided in setState!");
        }

        const type = options.type;
        const id = String(options.id);

        state[type] = state[type] || {};

        switch (options.stateMutationType) {
          case StateMutationType.DELETE:
            delete state[type][id];
            break;
          default:
            state[type][id] = options.resource;
        }
      },
      reactiveUpdate(
        state: { [index: string]: any },
        options: {
          type: string;
          id: string | null;
          key: string;
          value: any;
        } = {
          type: "",
          id: null,
          key: "",
          value: "",
        }
      ) {
        if (!options.type || options.key === undefined || options.value === undefined) {
          throw Error("no type, key, or value provided in reactiveUpdate!");
        }

        const type = options.type;
        const id = String(options.id);
        const key = String(options.key);
        const value = options.value;

        state[type][id].attributes[key] = value;
      },
    },
    actions: {
      async get(
        { commit, getters },
        {
          type,
          id,
          options,
        }: {
          type: string;
          id?: string | string[];
          options?: { [index: string]: any };
        }
      ) {
        try {
          if (!type) {
            throw Error("no type provided in get!");
          }

          if (isArray(id)) {
            const allResourcesAreCached = id.every((uniqueId) =>
              Boolean(getters.getState(type, uniqueId))
            );
            if (allResourcesAreCached) {
              return id.map(uniqueId =>
                backboneReactivityAdapter.ResourceModel(
                  getters.getState(type, uniqueId)
                )
              );
            } else if (!options?.link) {
              throw Error("no link was specified to fetch multiple IDs");
            } else {
              // if not all the resources are available, set the ID to undefined and proceed, assuming options.link is defined
              id = undefined;
            }
          } else {
            const inCache = getters.getState(type, id);
            if (inCache) {
              // even if sparse fields, return the full object if in cache
              // this means if object is cached and an includes is provided, the resource will not be fetched and the includes will need to be fetched later
              return backboneReactivityAdapter.ResourceModel(inCache);
            }
          }

          // the resource is not cached or the array requested is partially cached
          const { data, included } = await apiClient.get(type, id, options);

          const cacheAndParseResource = (
            resource: ResourceModel,
            isPartial: Boolean = false
          ): ResourceModel => {
            // if sparse field sets are requested, do NOT add them to the vuex cache
            if (!isPartial) {
              const inCache = getters.getState(resource.type, resource.id);

              // if its in the cache, merge the resource
              const commitResource = inCache
                ? Object.assign(inCache, resource)
                : resource;

              commit("setState", {
                stateMutationType: StateMutationType.SET,
                type: resource.type,
                id: resource.id,
                resource: commitResource,
              });

              return backboneReactivityAdapter.ResourceModel(
                commitResource,
                !!inCache
              );
            } else {
              // However, we want add the resource to the WeakMap. When this Resource Model is no longer referenced in the code, the weakmap will clean itself up and delete the record
              return backboneReactivityAdapter.ResourceModel(resource);
            }
          };

          let parsedResponse;
          let isSparse = includesFields(options?.query);

          if (isArray(data)) {
            parsedResponse = data.map((resource) =>
              cacheAndParseResource(resource, isSparse)
            );
          } else {
            parsedResponse = cacheAndParseResource(data, isSparse);
          }

          if (included) {
            // even if sparse fields sets are requested, included objects should be full objects that we can cache
            included.map((resource: ResourceModel) =>
              cacheAndParseResource(resource, false)
            );
          }

          return parsedResponse;
        } catch (err) {
          return null;
        }
      },
      async create(
        { commit },
        {
          resource,
        }: {
          resource: ParsedResourceModel;
        }
      ) {
        try {
          const rawResource = factory.toRawResourceModel(resource);

          const createdResource = await apiClient.create(rawResource);

          commit("setState", {
            stateMutationType: StateMutationType.SET,
            type: createdResource.type,
            id: createdResource.id,
            resource: createdResource,
          });

          return backboneReactivityAdapter.ResourceModel(createdResource);
        } catch (err) {
          return null;
        }
      },
      async update(
        { commit, getters },
        {
          resource,
          options,
        }: {
          resource: ParsedResourceModel;
          options?: { [index: string]: any };
        }
      ) {
        options = options || {};
        options.partial = options.partial === false ? options.partial : true;

        try {
          let rawResourcePartial = factory.toRawResourceModel(resource);

          // get the underlying resource placed in the WeakMap
          // If a resource exists in the cache, it cannot be a sparse fieldset, and therefor must contain all the fields of a given model.
          // when resources are updated, the whole resource is returned. The number of fields in the cache should match the number of fields in the returned updated model
          const rawResourceCached = getters.getState(
            resource.type,
            resource.id
          );

          if (!options.partial) {
            // this is now a new reference
            rawResourcePartial = {
              ...rawResourceCached,
              ...rawResourcePartial,
            };
          }

          const updatedResource = await apiClient.update(rawResourcePartial);

          // assign the updated values form the API by reference to the rawCachedResource
          //rawResourceCached.attributes = { 'thing': 'test'}
          Object.assign(rawResourceCached, updatedResource);

          //TODO: make sure the memory reference isn't overwritten here if one exists
          commit("setState", {
            stateMutationType: StateMutationType.SET,
            type: rawResourceCached.type,
            id: rawResourceCached.id,
            resource: rawResourceCached,
          });

          //then return proxy
          return backboneReactivityAdapter.ResourceModel(
            rawResourceCached,
            true
          );
        } catch (err) {
          return null;
        }
      },
      async delete(
        { commit, getters },
        {
          resource,
        }: {
          resource: ParsedResourceModel;
        }
      ) {
        try {
          let rawResource = factory.toRawResourceModel(resource);
          await apiClient.delete(rawResource);

          const rawCachedResource = getters.getState(
            resource.type,
            resource.id
          );

          if (rawCachedResource) {
            commit("setState", {
              stateMutationType: StateMutationType.DELETE,
              type: rawCachedResource.type,
              id: rawCachedResource.id,
              resource: undefined,
            });
          }
        } finally {
          // return the reference to the deleted resource
          return resource;
        }
      },
    },
  });

  function relationshipHandler(
    data: ResourceModel[] | ResourceModel,
    links: LinkRelationship,
    options: { [index: string]: any }
  ) {
    if (isArray(data)) {
      return store.dispatch("get", {
        type: data[0].type,
        id: data.map((datum) => datum.id),
        options: {
          query: options,
          link: links.related,
        },
      });
    } else {
      return store.dispatch("get", {
        type: data.type,
        id: data.id,
        options: {
          query: options,
          link: links.related,
        },
      });
    }
  }

  factory.registerRelationshipHandler(relationshipHandler);

  return store;
}
