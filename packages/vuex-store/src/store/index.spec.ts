import { Model } from "backbone";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import Vuex from "vuex";
import { createLocalVue } from "@vue/test-utils";
import buildStore, { buildRegisterStoreUpdateFunc } from "./index";
import { assign } from "lodash";

import { AxiosHttpClient } from "@atofstryker/json-api-http-client";
import { JsonApiClient } from "@atofstryker/json-api-client";
import BackboneReactivityAdapter from "@atofstryker/backbone-reactivity-adapter";
import BackboneFactory from '@atofstryker/backbone-model-factory-json-api'
import ResourceFactory from '@atofstryker/pojo-model-factory-json-api'
import { RawResponse } from "@atofstryker/json-api-types";

import {
  buildDog,
  parseDog,
  buildLegs,
  parsedLeg,
  buildOwner,
  parsedOwner,
  buildFeet,
} from "../../testing-utils";

function buildVuex() {
  const localVue = createLocalVue();
  localVue.use(Vuex);

  const httpClient = new AxiosHttpClient<RawResponse>();
  const resourceFactory = new ResourceFactory();
  const backboneFactory = new BackboneFactory<Model>(Model);

  const backboneReactivityAdapter = new BackboneReactivityAdapter(
    backboneFactory.toParsedBackboneModel.bind(backboneFactory),
    resourceFactory.toParsedResourceModel.bind(resourceFactory)
  );

  const jsonApiClient = new JsonApiClient(httpClient);

  return buildStore(jsonApiClient, resourceFactory, backboneReactivityAdapter);
}

describe("Vuex Store tests", () => {
  let axiosMockAdapter: AxiosMockAdapter, resourceFactory: ResourceFactory;
  beforeEach(() => {
    axiosMockAdapter = new AxiosMockAdapter(axios);
    resourceFactory = new ResourceFactory();
  });

  describe("get", () => {
    it("Fetches a resource by type and ID", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      //verify resource returned is in correct format
      expect(Dog).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          links: expect.any(Object),
          age: expect.any(String),
          color: expect.any(String),
          coolDoggoName: expect.any(String),
          isAGoodBoy: expect.any(Boolean),
          name: expect.any(String),
          Legs: expect.any(Function),
          Owner: expect.any(Function),
        })
      );

      //verify the response is cached and in the correct format
      expect($store.state["dog"]["17"]).toEqual(parseDog().data);
    });

    it("can fetch array of related resources", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());
      axiosMockAdapter.onGet("/api/dog/12/legs/").reply(200, buildLegs());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Legs = await Dog.Legs();

      //verify resource returned is in correct format

      Legs.forEach((Leg: any) => {
        expect(Leg).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            links: expect.any(Object),
            name: expect.any(String),
            isPeg: expect.any(Boolean),
            Dog: expect.any(Function),
          })
        );
        //verify the response is cached and in the correct format
        expect($store.state["leg"][Leg.id]).toEqual(parsedLeg(Leg.id));
      });
    });

    it("can fetch related resource object", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());
      axiosMockAdapter.onGet("/api/dog/12/owner/").reply(200, buildOwner(5));

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Owner = await Dog.Owner();

      expect(Owner).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          links: expect.any(Object),
          name: expect.any(String),
          isAGoodOwner: expect.any(Boolean),
          lastName: expect.any(String),
        })
      );

      //verify the response is cached and in the correct format
      expect($store.state["owner"][Owner.id]).toEqual(parsedOwner(Owner.id));
    });

    it("caches the resource and doesn't make additional http requests on n retreival", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog2 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog3 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      expect(Dog2).toEqual(Dog);
      expect(Dog3).toEqual(Dog2);
      expect(axiosMockAdapter.history.get.length).toBe(1);
    });
  });

  describe("cache / reactive cache", () => {
    it("caches the resource and doesn't make additional http requests on n retreival", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog2 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog3 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      expect(Dog2).toEqual(Dog);
      expect(Dog3).toEqual(Dog2);
      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("Gets the first item in the cache if no id is provided, given there is only one record in the cache", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog2 = await $store.dispatch("get", {
        type: "dog",
      });

      expect(Dog2).toEqual(Dog);
      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("updates the store state directly when values are changed on the object", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      expect(Dog.name).toEqual("Doge");
      expect($store.state["dog"]["17"].attributes.name).toEqual("Doge");

      Dog.name = "Lucky";

      expect(Dog.name).toEqual("Lucky");
      expect($store.state["dog"]["17"].attributes.name).toEqual("Lucky");
    });

    it("updates the same object reference directly when values are changed on the object", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog2 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const Dog3 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      expect(Dog.name).toEqual("Doge");
      expect(Dog2.name).toEqual("Doge");
      expect(Dog3.name).toEqual("Doge");
      expect($store.state["dog"]["17"].attributes.name).toEqual("Doge");

      Dog.name = "Lucky";

      expect(Dog.name).toEqual("Lucky");
      expect(Dog2.name).toEqual("Lucky");
      expect(Dog3.name).toEqual("Lucky");
      expect($store.state["dog"]["17"].attributes.name).toEqual("Lucky");
    });
  });

  describe("Error handling", () => {
    it("returns null when no type is provided in get", async () => {
      const $store = buildVuex();
      const resource = await $store.dispatch("get", {});
      expect(resource).toBeNull();
    });

    it("returns null when no link for multifetch is provided in get", async () => {
      const $store = buildVuex();

      const Dogs = await $store.dispatch("get", {
        type: "dog",
        id: [1, 2, 3, 4],
      });

      expect(Dogs).toBeNull();
    });
  });

  describe("sparse field sets", () => {
    it("Returns a full cached resource (Object), if one exists, when the same resource with a sparse field set is requested", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      // fetches a Dog and puts it into the cache
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const sparseOptions = {
        query: {
          "fields[dog]": "name, age",
        },
      };

      // get a dog, but since one with the same type and id (full object) exists, return that
      const sparseDog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
        options: sparseOptions,
      });

      expect(Dog).toEqual(sparseDog);
      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("Does not cache sparse resource (Object), if full cached resource does not exist", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      // response doesn't matter as the store THINKs the fieldset is sparse
      axiosMockAdapter.onGet("/dog/17/").reply(200, buildDog());

      const sparseOptions = {
        query: {
          "fields[dog]": "name, age",
        },
      };

      // fetch a dog with sparse field sets. Since none exist in the cache, don't caache since this is a sparse field set
      const sparseDog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
        options: sparseOptions,
      });

      expect($store.state["dog"] && $store.state["dog"]["17"]).toBeUndefined();

      // fetch a full dog. Since it's a full dog, we want to place it into the cache
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      expect($store.state["dog"]["17"]).toEqual(parseDog().data);
      expect(sparseDog == Dog).toBe(false);

      // refetch the previous sparse fieldset. Since one exists in the cache, return it
      const sparseDog2 = await $store.dispatch("get", {
        type: "dog",
        id: "17",
        options: sparseOptions,
      });

      expect(sparseDog2 == Dog).toBe(true);
      expect(axiosMockAdapter.history.get.length).toBe(2);
    });

    it("Does not cache sparse resource (Object), if full cached resource does not exist, but adds included params in request to cache", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      // response doesn't matter as the store THINKs the fieldset is sparse
      const response = {
        ...buildDog(),
        included: buildLegs().data,
      };
      axiosMockAdapter.onGet("/dog/17/").reply(200, response);

      const sparseOptions = {
        query: {
          "fields[dog]": "name, age",
        },
        included: "legs",
      };

      // fetch a dog with sparse field sets. Since none exist in the cache, don't caache since this is a sparse field set
      const sparseDog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
        options: sparseOptions,
      });

      expect($store.state["dog"] && $store.state["dog"]["17"]).toBeUndefined();

      //check to see if there are any legs in the cache from the fetch
      expect($store.state["leg"] && $store.state["leg"]["1"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["2"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["3"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["4"]).toBeDefined();

      // get the legs. No requests should be made as values are in cache
      await sparseDog.Legs();

      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("Returns a full cached resource (Array), if one exists, when the same resource with a sparse field set is requested", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/api/dog/12/legs/").reply(200, buildLegs());

      const queryOptions = {
        link: "/api/dog/12/legs/",
      };

      // mock getting a related resource
      const Legs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: queryOptions,
      });

      const sparseOptions = {
        query: {
          "fields[leg]": "name",
        },
        ...queryOptions,
      };

      const sparseLegs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: sparseOptions,
      });

      expect(Legs).toEqual(sparseLegs);
      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("Does not cache sparse resource (Array), if full cached resource does not exist", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);
      axiosMockAdapter.onGet("/api/dog/12/legs/").reply(200, buildLegs());

      const queryOptions = {
        link: "/api/dog/12/legs/",
      };

      const sparseOptions = {
        query: {
          "fields[leg]": "name",
        },
        ...queryOptions,
      };

      // fetch legs with sparse field sets. Since none exist in the cache, don't cache since this is an array of sparse field set
      const sparseLegs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: sparseOptions,
      });

      sparseLegs.forEach((leg: any) => {
        expect(
          $store.state["leg"] && $store.state["leg"][leg.id]
        ).toBeUndefined();
      });

      // fetch array of leg objects. Since it's a 'full' array of leg objects with no sparse fields, we want to place it into the cache
      const Legs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: queryOptions,
      });

      Legs.forEach((leg: any, idx: number) => {
        expect($store.state["leg"][leg.id]).toEqual(parsedLeg(leg.id));
        expect(sparseLegs[idx] == Legs[idx]).toBe(false);
      });

      // refetch the previous sparse fieldset. Since one exists in the cache, return it
      const sparseLegs2 = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: sparseOptions,
      });

      sparseLegs2.forEach((leg: any, idx: number) => {
        expect(sparseLegs2[idx] == Legs[idx]).toBe(true);
      });

      expect(axiosMockAdapter.history.get.length).toBe(2);
    });

    it("Does not cache sparse resource (Array), if full cached resource does not exist, but adds included params in request to cache", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      // response doesn't matter as the store THINKs the fieldset is sparse
      const response = {
        data: buildLegs().data,
        included: buildFeet().data,
      };
      axiosMockAdapter.onGet("/api/dog/12/legs/").reply(200, response);

      const queryOptions = {
        link: "/api/dog/12/legs/",
      };

      const sparseOptions = {
        query: {
          "fields[leg]": "name",
        },
        included: "legs",
        ...queryOptions,
      };

      const sparseLegs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options: sparseOptions,
      });

      expect($store.state["leg"] && $store.state["leg"]["1"]).toBeUndefined();
      expect($store.state["leg"] && $store.state["leg"]["2"]).toBeUndefined();
      expect($store.state["leg"] && $store.state["leg"]["3"]).toBeUndefined();
      expect($store.state["leg"] && $store.state["leg"]["4"]).toBeUndefined();

      //check to see if there are any feet in the cache from the fetch
      expect($store.state["foot"] && $store.state["foot"]["1"]).toBeDefined();
      expect($store.state["foot"] && $store.state["foot"]["2"]).toBeDefined();

      await sparseLegs[0].Feet();

      expect(axiosMockAdapter.history.get.length).toBe(1);
    });
  });

  describe("Includes", () => {
    it("Adds fetched object to cache (Object) and adds included  in request to cache", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      const response = {
        ...buildDog(),
        included: buildLegs().data,
      };
      axiosMockAdapter.onGet("/dog/17/").reply(200, response);

      const options = {
        included: "legs",
      };

      // fetch a full dog with included legs
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
        options,
      });

      expect($store.state["dog"]["17"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["1"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["2"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["3"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["4"]).toBeDefined();

      // get the legs, no requests should be made as values are in cache
      await Dog.Legs();

      expect(axiosMockAdapter.history.get.length).toBe(1);
    });

    it("Adds fetched object to cache (Array) and adds included  in request to cache", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      const response = {
        data: buildLegs().data,
        included: buildFeet().data,
      };
      axiosMockAdapter.onGet("/api/dog/12/legs/").reply(200, response);

      const options = {
        included: "legs",
        link: "/api/dog/12/legs/",
      };

      const sparseLegs = await $store.dispatch("get", {
        type: "leg",
        id: [1, 2, 3, 4],
        options,
      });

      // data and included values should be in cache
      expect($store.state["leg"] && $store.state["leg"]["1"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["2"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["3"]).toBeDefined();
      expect($store.state["leg"] && $store.state["leg"]["4"]).toBeDefined();
      expect($store.state["foot"] && $store.state["foot"]["1"]).toBeDefined();
      expect($store.state["foot"] && $store.state["foot"]["2"]).toBeDefined();

      // get the feet, no requests should be made as values are in cache
      await sparseLegs[0].Feet();

      expect(axiosMockAdapter.history.get.length).toBe(1);
    });
  });

  describe("Create", () => {
    it("sucessfully creates a resource", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      axiosMockAdapter.onPost("/dog/").reply((config) => {
        return [201, buildDog()];
      });

      const dogToMake = {
        type: "dog",
        name: "Doge",
        age: "3",
        color: "brown",
        coolDoggoName: "DOGE the cool dog",
        isAGoodBoy: true,
        Legs: [
          {
            id: "1",
            type: "leg",
          },
          {
            id: "2",
            type: "leg",
          },
          {
            id: "3",
            type: "leg",
          },
          {
            id: "4",
            type: "leg",
          },
        ],
        Owner: {
          id: "5",
          type: "owner",
        },
      };
      const newDog = await $store.dispatch("create", { resource: dogToMake });

      const builtDog = buildDog();
      const stringifiedDogToMake = {
        ...dogToMake,
        Legs: {
          data: dogToMake.Legs,
          links: builtDog.data.relationships.legs.links,
        },
        Owner: {
          data: dogToMake.Owner,
          links: builtDog.data.relationships.owner.links,
        },
      };
      expect(JSON.parse(JSON.stringify(newDog))).toMatchObject(
        JSON.parse(JSON.stringify(stringifiedDogToMake))
      );

      expect($store.state["dog"] && $store.state["dog"]["17"]).toEqual(
        parseDog().data
      );
    });
  });

  describe("updates", () => {
    it("sucessfully updates a resource partially", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      const response = {
        ...buildDog(),
      };
      axiosMockAdapter.onGet("/dog/17/").reply(200, response);

      // fetch a full dog and put it in the cache
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      //verify the item in the cache
      expect($store.state["dog"]["17"]).toEqual(parseDog().data);

      axiosMockAdapter.onPatch("/api/dog/17/").reply((config) => {
        const dogBase = buildDog().data;
        const dogUpdated = JSON.parse(config.data).data;
        // merge the object
        const dogReturn = assign({}, dogBase, dogUpdated);

        dogReturn.attributes = {
          ...dogBase.attributes,
          ...dogReturn.attributes,
        };

        dogReturn.relationships.legs.data = [
          ...dogBase.relationships.legs.data,
          ...dogReturn.relationships.legs.data,
        ];
        return [200, { data: dogReturn }];
      });

      const dogToUpdatePartial = {
        id: "17",
        type: "dog",
        age: "4",
        coolDoggoName: "Dogge the bad boy",
        isAGoodBoy: false,
        links: {
          self: `/api/dog/17/`,
        },
        Legs: [
          {
            id: "5",
            type: "leg",
          },
          {
            id: "6",
            type: "leg",
          },
          {
            id: "7",
            type: "leg",
          },
        ],
        Owner: {
          id: "5",
          type: "owner",
        },
      };

      // since this is partial update, fields will be merged in as previous. Doge now has 7 legs! Woah!
      const updatedDog = await $store.dispatch("update", {
        resource: dogToUpdatePartial,
      });

      expect(Dog == updatedDog).toBe(true);

      const { Legs: partialLegs, Owner: partialOwner, ...partial } = JSON.parse(
        JSON.stringify(dogToUpdatePartial)
      );
      const { Legs: updatedLegs, Owner: updatedOwner, ...updated } = JSON.parse(
        JSON.stringify(updatedDog)
      );

      expect(updatedLegs.data).toEqual(expect.arrayContaining(partialLegs));

      expect(updatedOwner.data).toEqual(partialOwner);

      expect(updated).toEqual(expect.objectContaining(partial));

      expect($store.state["dog"] && $store.state["dog"]["17"]).toEqual(
        expect.objectContaining(resourceFactory.toRawResourceModel(updatedDog))
      );
    });

    it("sucessfully updates a resource fully", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      const response = {
        ...buildDog(),
      };
      axiosMockAdapter.onGet("/dog/17/").reply(200, response);

      // fetch a full dog and put it in the cache
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      //verify the item in the cache
      expect($store.state["dog"]["17"]).toEqual(parseDog().data);

      axiosMockAdapter.onPatch("/api/dog/17/").reply((config) => {
        return [200, { data: JSON.parse(config.data).data }];
      });

      const dogToUpdateFull = {
        id: "17",
        type: "dog",
        age: "4",
        coolDoggoName: "Dogge the bad boy",
        isAGoodBoy: false,
        links: {
          self: `/api/dog/17/`,
        },
        Legs: [
          {
            id: "5",
            type: "leg",
          },
          {
            id: "6",
            type: "leg",
          },
          {
            id: "7",
            type: "leg",
          },
          // An alligator took Doug's leg, a common occurance in Florida...
        ],
        Owner: {
          id: "5",
          type: "owner",
        },
      };

      // since this is partial update, fields will be merged in as previous. Doge now has 7 legs! Woah!
      const updatedDog = await $store.dispatch("update", {
        resource: dogToUpdateFull,
      });

      expect(Dog == updatedDog).toBe(true);

      const { Legs: partialLegs, Owner: partialOwner, ...partial } = JSON.parse(
        JSON.stringify(dogToUpdateFull)
      );
      const { Legs: updatedLegs, Owner: updatedOwner, ...updated } = JSON.parse(
        JSON.stringify(updatedDog)
      );

      expect(updatedLegs.data).toEqual(partialLegs);

      expect(updatedOwner.data).toEqual(partialOwner);

      expect(updated).toEqual(partial);

      expect($store.state["dog"] && $store.state["dog"]["17"]).toEqual(
        expect.objectContaining(resourceFactory.toRawResourceModel(updatedDog))
      );
    });
  });

  describe("deletes", () => {
    it("sucessfully deletes a resource", async () => {
      const $store = buildVuex();
      let axiosMockAdapter = new AxiosMockAdapter(axios);

      const response = {
        ...buildDog(),
      };
      axiosMockAdapter.onGet("/dog/17/").reply(200, response);

      // fetch a full dog and put it in the cache
      const Dog = await $store.dispatch("get", {
        type: "dog",
        id: "17",
      });

      const dogSnapshot = JSON.parse(JSON.stringify(Dog));

      //verify the item in the cache
      expect($store.state["dog"]["17"]).toEqual(parseDog().data);

      axiosMockAdapter.onDelete("/api/dog/17/").reply(204);

      const deletedDog = await $store.dispatch("delete", {
        resource: Dog,
      });
      expect(Dog == deletedDog).toBe(true);

      /**
       * NOTE:
       * though the item is no longer in the cache, there is still a reference to the ResourceModel within the BackboneReactivityAdapter WeakMap.
       * This is to prevent anything that is referencing this object in memory from exploding. Once the block exists, or the resource is set to undefined or null, the record
       * will clean itself up. This is why we return the deleted object on the delete call so whoever is invoking the delete has a direct reference to it.
       * The caller can either chose to do nothing with the reference, let it expire and clean up, or still manupulate it for the life of their view set.
       *
       * If manupulating, the reactivty will still work. It's just not in the vuex cache
       */

      // stringifty and parse the object to compare relationships
      expect(JSON.parse(JSON.stringify(Dog))).toEqual(dogSnapshot);

      //verify the item is NOT in the cache
      expect($store.state["dog"]["17"]).toBeUndefined();
    });
  });

  describe("buildRegisterStoreUpdateFunc / reactiveUpdate", () => {
    it("builds an updater function that can be used elsewhere", () => {
      const $store = buildVuex();
      $store.commit = jest.fn();
      const updateFunc = buildRegisterStoreUpdateFunc($store);
      updateFunc("cat", "7", "name", "kitty");

      expect($store.commit).toHaveBeenCalledTimes(1);
      expect($store.commit).toHaveBeenCalledWith("reactiveUpdate", {
        type: "cat",
        id: "7",
        key: "name",
        value: "kitty",
      });
    });

    it("Throws and error when no type, key or value are present in reactiveUpdateCommit", () => {
      const $store = buildVuex();

      expect(() => {
        $store.commit("reactiveUpdate")
      }).toThrowError()
      $store.commit = jest.fn();
    });


    it("reactiveUpdateCommit succeeds when type, id, key, and value are provided", () => {
      const $store = buildVuex();
      // prepopulate the cache to test this functionality, as it assumes values already exist in memory
      $store.replaceState({
        cat: {
          7: {
            attributes: {

            }
          }
        }
      })

      expect(() => {
        $store.commit("reactiveUpdate", {
          type: 'cat',
          id: '7',
          key: 'meow',
          value: 'roar'
        })
      }).not.toThrowError()
    });
  });
});
