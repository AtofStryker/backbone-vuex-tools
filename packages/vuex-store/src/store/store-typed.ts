import { Store } from "vuex";
import { ParsedResourceModel } from "@atofstryker/json-api-types";

export default class VuexStore {
  private _store: Store<any>;

  constructor(store: Store<any>) {
    this._store = store;
  }

  async get(
    type: string,
    id?: string | null,
    options?: { [index: string]: any }
  ) {
    return this._store.dispatch("get", {
      type,
      id,
      options,
    });
  }

  async create(resource: ParsedResourceModel) {
    return this._store.dispatch("create", { resource });
  }

  async update(resource: ParsedResourceModel) {
    return this._store.dispatch("update", { resource });
  }

  async delete(resource: ParsedResourceModel) {
    return this._store.dispatch("delete", { resource });
  }
}
