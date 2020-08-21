import StoreTyped from "./store-typed";
import Vuex, { Store } from "vuex";

import Vue from 'vue'

Vue.use(Vuex)

describe("Index exports", () => {
  let storeTyped: StoreTyped;
  let mockStore: Store<any>;

  beforeEach(() => {
    mockStore = new Vuex.Store({});
    mockStore.dispatch = jest.fn();
    storeTyped = new StoreTyped(mockStore);
  });

  it("calls dispatch correctly for get", () => {
    storeTyped.get("name", "4", {});

    expect(mockStore.dispatch).toHaveBeenCalledWith("get", {
      type: "name",
      id: "4",
      options: {},
    });
  });

  it("calls dispatch correctly for create", () => {
    const mockResource: any = {}
    storeTyped.create(mockResource);

    expect(mockStore.dispatch).toHaveBeenCalledWith("create", {
      resource: {},
    });
  });

  it("calls dispatch correctly for update", () => {
    const mockResource: any = {}
    storeTyped.update(mockResource);

    expect(mockStore.dispatch).toHaveBeenCalledWith("update", {
      resource: {},
    });
  });

  it("calls dispatch correctly for delete", () => {
    const mockResource: any = {}
    storeTyped.delete(mockResource);

    expect(mockStore.dispatch).toHaveBeenCalledWith("delete", {
      resource: {},
    });
  });
});
