export function buildDog() {
  return {
    data: {
      id: "17",
      type: "dog",
      attributes: {
        name: "Doge",
        age: "3",
        color: "brown",
        "cool-doggo-name": "DOGE the cool dog",
        "is-a-good-boy": true,
      },
      links: {
        self: "/api/dog/17/",
      },
      relationships: {
        owner: {
          data: {
            id: "5",
            type: "owner",
          },
          links: {
            related: "/api/dog/12/owner/",
            self: "/api/dog/12/relationships/owner/",
          },
        },
        legs: {
          data: [
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
          links: {
            related: "/api/dog/12/legs/",
            self: "/api/dog/12/relationships/legs/",
          },
        },
      },
    },
  };
}

export function parseDog() {
  return {
    data: {
      id: "17",
      type: "dog",
      attributes: {
        name: "Doge",
        age: "3",
        color: "brown",
        coolDoggoName: "DOGE the cool dog",
        isAGoodBoy: true,
      },
      links: {
        self: "/api/dog/17/",
      },
      relationships: {
        owner: {
          data: {
            id: "5",
            type: "owner",
          },
          links: {
            related: "/api/dog/12/owner/",
            self: "/api/dog/12/relationships/owner/",
          },
        },
        legs: {
          data: [
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
          links: {
            related: "/api/dog/12/legs/",
            self: "/api/dog/12/relationships/legs/",
          },
        },
      },
    },
  };
}

export function buildOwner(id: number) {
  return {
    data: {
      id: String(id),
      type: "owner",
      attributes: {
        name: "Peggy Sue",
        "is-a-good-owner": true,
        "last-name": "Hill",
      },
      links: {
        self: `/api/owner/${id}/`,
      },
    },
  };
}

export function parsedOwner(id: string) {
  return {
    id: String(id),
    type: "owner",
    attributes: {
      name: "Peggy Sue",
      isAGoodOwner: true,
      lastName: "Hill",
    },
    links: {
      self: `/api/owner/${id}/`,
    },
  };
}

export function buildLegs() {
  return {
    data: [1, 2, 3, 4].map((id) => {
      return {
        id: String(id),
        type: "leg",
        attributes: {
          name: `Leg${id}`,
          "is-peg": true,
        },
        links: {
          self: `/api/leg/${id}/`,
        },
        relationships: {
          dog: {
            data: {
              id: "17",
              type: "dog",
            },
            links: {
              related: "/api/leg/12/dog/",
              self: "/api/leg/12/relationships/dog/",
            },
          },
          feet: {
            data: [
              {
                id: "1",
                type: "foot",
              },
              {
                id: "2",
                type: "foot",
              },
            ],
            links: {
              related: `/api/leg/${id}/foot/`,
              self: `/api/leg/${id}/relationships/foot/`,
            },
          },
        },
      };
    }),
  };
}

export function parsedLeg(id: string) {
  return {
    id: String(id),
    type: "leg",
    attributes: {
      name: `Leg${id}`,
      isPeg: true,
    },
    links: {
      self: `/api/leg/${id}/`,
    },
    relationships: {
      dog: {
        data: {
          id: "17",
          type: "dog",
        },
        links: {
          related: `/api/leg/12/dog/`,
          self: `/api/leg/12/relationships/dog/`,
        },
      },
      feet: {
        data: [
          {
            id: "1",
            type: "foot",
          },
          {
            id: "2",
            type: "foot",
          },
        ],
        links: {
          related: `/api/leg/${id}/foot/`,
          self: `/api/leg/${id}/relationships/foot/`,
        },
      },
    },
  };
}

export function buildFeet() {
  return {
    data: [1, 2].map((id) => {
      return {
        id: String(id),
        type: "foot",
        attributes: {
          name: `Foot${id}`,
        },
        links: {
          self: `/api/foot/${id}/`,
        },
        relationships: {
          leg: {
            data: {
              id: "1",
              type: "leg",
            },
            links: {
              related: `/api/foot/${id}/leg/`,
              self: `/api/foot/${id}/relationships/leg/`,
            },
          },
        },
      };
    }),
  };
}

export function parsedFoot(id: string) {
  return {
    id: String(id),
    type: "foot",
    attributes: {
      name: `Foot${id}`,
    },
    links: {
      self: `/api/foot/${id}/`,
    },
    relationships: {
      leg: {
        data: {
          id: "1",
          type: "leg",
        },
        links: {
          related: `/api/foot/${id}/leg/`,
          self: `/api/foot/${id}/relationships/leg/`,
        },
      },
    },
  };
}
