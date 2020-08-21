import BackboneVuexAdapter from "./index";
import { camelCar, kebabCar } from "../test-utils";
import BackboneReactivityAdapter from "@atofstryker/backbone-reactivity-adapter";
import CustomBackboneModel from '../test-utils/test-model-mock'
import JsonApiParserBackbone from '../test-utils/test-parser-mock'
import BackboneFactory from "@atofstryker/backbone-model-factory-json-api";

describe("BackboneVuexAdapter", () => {
  let mockStore: any;
  let mockResourceFactory: any;
  let backboneReactivityAdapter: BackboneReactivityAdapter<
    any,
    typeof CustomBackboneModel,
    Object
  >;
  let vuexAdapter: BackboneVuexAdapter;
  let mockCache: any;

  beforeEach(() => {
    mockCache = {};
    mockResourceFactory = jest.fn();
    mockStore = {
      getters: {
        getState: jest.fn(),
      },
      commit: jest.fn(),
    };
    const parser = new JsonApiParserBackbone();
    const backboneFactory = new BackboneFactory(
      CustomBackboneModel,
      parser.parse.bind(parser)
    );

    backboneReactivityAdapter = new BackboneReactivityAdapter<
      any,
      typeof CustomBackboneModel,
      Object
    >(
      backboneFactory.toParsedBackboneModel.bind(backboneFactory),
      mockResourceFactory
    );
    vuexAdapter = new BackboneVuexAdapter(mockStore, backboneReactivityAdapter);

    mockStore.getters.getState.mockImplementation(
      (type: string, id: string) => {
        return (
          (mockCache[type] && mockCache[type][id]
            ? mockCache[type][id]
            : null) || null
        );
      }
    );

    mockStore.commit.mockImplementation((action: string, args: any) => {
      mockCache[args.type] = mockCache[args.type] || {};
      mockCache[args.type][args.id] = mockCache[args.type][args.id] =
        args.resource;
    });
  });

  it("returns null when nothing exists in the cache", () => {
    const rawCar = kebabCar();
    const resource = vuexAdapter.get(rawCar.type, rawCar.id);
    expect(resource).toBeNull();
  });

  it("sets a raw resource in the cache ", () => {
    const rawCar = kebabCar();
    const parsedCar = camelCar();

    const backboneCar = vuexAdapter.set(rawCar, rawCar.type, rawCar.id);

    expect(mockStore.getters.getState).toHaveBeenNthCalledWith(
      1,
      rawCar.type,
      rawCar.id
    );
    expect(mockStore.commit).toHaveBeenNthCalledWith(1, "setState", {
      stateMutationType: "SET",
      type: rawCar.type,
      id: rawCar.id,
      resource: camelCar(),
    });

    expect(backboneCar).toBeUndefined();

    const backboneCar2 = vuexAdapter.get(
      rawCar.type,
      rawCar.id
    ) as typeof CustomBackboneModel;

    expect(backboneCar2).toBeDefined();

    expect(backboneCar2.get("id")).toEqual(String(parsedCar.id));
    expect(backboneCar2.get("_type")).toEqual(parsedCar.type);
    expect(backboneCar2.get("_self")).toEqual(parsedCar.links.self);
    expect(backboneCar2.get("availableTrims")).toEqual(
      parsedCar.attributes.availableTrims
    );
    expect(backboneCar2.get("color")).toEqual(parsedCar.attributes.color);
    expect(backboneCar2.get("model")).toEqual(parsedCar.attributes.model);
    expect(backboneCar2.get("name")).toEqual(parsedCar.attributes.name);
    expect(backboneCar2.get("seats")).toEqual(parsedCar.attributes.seats);
    expect(backboneCar2.get("relationships")).toEqual(parsedCar.relationships);
  });

  it("returns the same instance of a cached item if exists", () => {
    const rawCar = kebabCar();

    vuexAdapter.set(rawCar, rawCar.type, rawCar.id);

    const backboneCar2 = vuexAdapter.get(
      rawCar.type,
      rawCar.id
    ) as typeof CustomBackboneModel;

    const backboneCar3 = vuexAdapter.get(
      rawCar.type,
      rawCar.id
    ) as typeof CustomBackboneModel;

    expect(backboneCar2 === backboneCar3).toEqual(true);
  });

  it("Updates a model by reference if the model is being set and already exists in the cache", () => {
    const rawCar = kebabCar();
    const parsedCar = camelCar();

    vuexAdapter.set(rawCar, rawCar.type, rawCar.id);

    const backboneCar = vuexAdapter.get(
      rawCar.type,
      rawCar.id
    ) as typeof CustomBackboneModel;

    const previousBackboneCare = JSON.parse(JSON.stringify(backboneCar));

    const rawCar2 = kebabCar();
    rawCar2.attributes.color = "yellow";
    rawCar2.attributes["available-trims"] = {
      prop1: 1,
      prop2: 2,
    } as any;
    rawCar2.attributes.seats = [];

    vuexAdapter.set(rawCar2, rawCar2.type, rawCar2.id);

    const backboneCar2 = vuexAdapter.get(
      rawCar.type,
      rawCar.id
    ) as typeof CustomBackboneModel;

    const nextBackboneCare = JSON.parse(JSON.stringify(backboneCar2));

    expect(backboneCar === backboneCar2).toEqual(true);
    expect(backboneCar.get("id")).toEqual(String(parsedCar.id));
    expect(backboneCar.get("_type")).toEqual(parsedCar.type);
    expect(backboneCar.get("_self")).toEqual(parsedCar.links.self);
    expect(backboneCar.get("availableTrims")).toEqual({
      prop1: 1,
      prop2: 2,
    });
    expect(backboneCar2.get("color")).toEqual("yellow");
    expect(backboneCar2.get("model")).toEqual(parsedCar.attributes.model);
    expect(backboneCar2.get("name")).toEqual(parsedCar.attributes.name);
    expect(backboneCar2.get("seats")).toEqual([]);
    expect(backboneCar2.get("relationships")).toEqual(parsedCar.relationships);
    expect(mockResourceFactory).not.toHaveBeenCalled();

    expect(nextBackboneCare).not.toEqual(previousBackboneCare);
  });
});
