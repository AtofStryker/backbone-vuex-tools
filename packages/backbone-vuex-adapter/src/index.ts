import { Store } from "vuex";
import { Model } from "backbone";
import BackboneReactivityAdapter from "@atofstryker/backbone-reactivity-adapter";
import { ResourceModel } from "@atofstryker/json-api-types";
import Parser from "@atofstryker/json-api-parser";

export default class BackboneStoreRepositoryAdapter {
  private _vuexStore: Store<any>;
  private _backboneReactivityAdapter: BackboneReactivityAdapter<
    ResourceModel,
    Model,
    any
  >;
  private _parser: Parser;

  constructor(
    vuexStore: Store<any>,
    backboneReactivityAdapter: BackboneReactivityAdapter<any, Model, any>
  ) {
    this._vuexStore = vuexStore;
    this._backboneReactivityAdapter = backboneReactivityAdapter;
    this._parser = new Parser();
  }

  get(type: string, id: string | null): Model | null {
    const rawResource = this._vuexStore.getters.getState(type, id);

    return rawResource
      ? this._backboneReactivityAdapter.BackboneModel(rawResource)
      : null;
  }

  set(rawResource: ResourceModel, type: string, id: string | null): void {
    const rawResourceCached = this._vuexStore.getters.getState(type, id);

    const camelizedResource = this._parser.parse(rawResource) as ResourceModel;
    if (!rawResourceCached) {
      this._vuexStore.commit("setState", {
        stateMutationType: "SET",
        type,
        id,
        resource: camelizedResource,
      });

      this._backboneReactivityAdapter.BackboneModel(camelizedResource);
    } else {
      // it's in the cache already, update it!
      Object.assign(rawResourceCached, camelizedResource);

      this._vuexStore.commit("setState", {
        stateMutationType: "SET",
        type,
        id,
        resource: rawResourceCached,
      });
      this._backboneReactivityAdapter.BackboneModel(rawResourceCached, true);
    }
  }
}
