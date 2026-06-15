function timestamp(offsetHours = 0) {
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString();
}

export function createSeedData() {
  const now = timestamp(0);
  const yesterday = timestamp(-24);
  const twoDaysAgo = timestamp(-48);

  return {
    projects: [
      {
        id: "proj-1",
        projectId: "PRJ-8902",
        name: "Flight Control Board V2",
        category: "PCBA",
        subAssembly: "Main Board",
        currentVersion: "v2.4.1",
        author: "Zhang San",
        authorInitials: "ZS",
        status: "approved",
        lastModified: now,
        createdAt: twoDaysAgo,
        updatedAt: now,
        parts: [
          {
            id: "part-1",
            partNumber: "MCU-32F407",
            description: "ARM Cortex-M4 MCU, 168MHz",
            quantity: 1,
            refDes: "U1",
            manufacturer: "STMicroelectronics",
            footprint: "LQFP-144",
            status: "verified",
            createdAt: twoDaysAgo,
            updatedAt: now
          },
          {
            id: "part-2",
            partNumber: "REG-3.3V-1A",
            description: "3.3V low dropout regulator",
            quantity: 2,
            refDes: "U2,U3",
            manufacturer: "Texas Instruments",
            footprint: "SOT-223",
            status: "outdated",
            createdAt: twoDaysAgo,
            updatedAt: yesterday
          },
          {
            id: "part-3",
            partNumber: "CONN-USB-C",
            description: "USB Type-C receptacle",
            quantity: 1,
            refDes: "J1",
            manufacturer: "Unknown",
            footprint: "SMT-TypeC",
            status: "missing",
            createdAt: twoDaysAgo,
            updatedAt: yesterday
          }
        ],
        versions: [
          {
            id: "ver-1",
            version: "v2.4.1",
            description: "Power stage update",
            author: "Zhang San",
            createdAt: now,
            isActive: true
          },
          {
            id: "ver-2",
            version: "v2.4.0",
            description: "Minor fixes",
            author: "Zhang San",
            createdAt: yesterday,
            isActive: false
          }
        ]
      },
      {
        id: "proj-2",
        projectId: "PRJ-8901",
        name: "Motor Housing Assembly",
        category: "Mechanical",
        subAssembly: "Outer Case",
        currentVersion: "v1.0.0",
        author: "Li Si",
        authorInitials: "LS",
        status: "pending",
        lastModified: yesterday,
        createdAt: twoDaysAgo,
        updatedAt: yesterday,
        parts: [
          {
            id: "part-4",
            partNumber: "HOUSING-AL-2020",
            description: "Aluminum housing frame",
            quantity: 4,
            refDes: "H1-H4",
            manufacturer: "Misumi",
            footprint: "N/A",
            status: "verified",
            createdAt: twoDaysAgo,
            updatedAt: yesterday
          }
        ],
        versions: [
          {
            id: "ver-3",
            version: "v1.0.0",
            description: "Initial release",
            author: "Li Si",
            createdAt: yesterday,
            isActive: true
          }
        ]
      }
    ],
    materials: [
      {
        id: "mat-1",
        partNumber: "C-0402-104K-10V",
        description: "0.1uF 10V capacitor",
        manufacturer: "Murata",
        category: "Capacitors",
        inventory: 12500,
        status: "preferred",
        createdAt: now
      },
      {
        id: "mat-2",
        partNumber: "R-0402-10K-1%",
        description: "10k resistor 1%",
        manufacturer: "Vishay",
        category: "Resistors",
        inventory: 50000,
        status: "preferred",
        createdAt: yesterday
      },
      {
        id: "mat-3",
        partNumber: "IC-NRF52840",
        description: "Bluetooth SoC",
        manufacturer: "Nordic Semi",
        category: "IC",
        inventory: 0,
        status: "eol",
        createdAt: yesterday
      }
    ],
    activities: [
      {
        id: "act-1",
        user: "Zhang San",
        action: "updated",
        target: "Flight Control Board V2",
        detail: "Adjusted regulator selection",
        timestamp: now,
        type: "edit"
      },
      {
        id: "act-2",
        user: "Li Si",
        action: "submitted",
        target: "Motor Housing Assembly",
        detail: "Waiting for approval",
        timestamp: yesterday,
        type: "confirm"
      }
    ],
    modules: [
      {
        id: "mod-1",
        name: "Vision System",
        description: "Reusable machine vision building blocks",
        icon: "videocam",
        subModules: [
          {
            id: "sub-1",
            name: "Camera",
            description: "Industrial camera options",
            parts: [
              {
                id: "mp-1",
                partNumber: "MER-500-14U3M",
                description: "5MP USB3 industrial camera",
                manufacturer: "Hikrobot",
                alternates: [
                  {
                    manufacturer: "Basler",
                    partNumber: "aceA2000-50gc",
                    notes: "Higher frame rate"
                  }
                ],
                quantity: 1
              }
            ],
            createdAt: yesterday,
            updatedAt: now
          }
        ],
        createdAt: yesterday,
        updatedAt: now
      }
    ],
    users: [
      {
        id: "user-1",
        username: "admin",
        displayName: "System Admin",
        email: "admin@bom.local",
        password: "admin123",
        role: "admin",
        initials: "SA",
        createdAt: twoDaysAgo
      },
      {
        id: "user-2",
        username: "zhangsan",
        displayName: "Zhang San",
        email: "zhangsan@bom.local",
        password: "demo",
        role: "editor",
        initials: "ZS",
        createdAt: twoDaysAgo
      },
      {
        id: "user-3",
        username: "lisi",
        displayName: "Li Si",
        email: "lisi@bom.local",
        password: "demo",
        role: "editor",
        initials: "LS",
        createdAt: twoDaysAgo
      },
      {
        id: "user-4",
        username: "wangwu",
        displayName: "Wang Wu",
        email: "wangwu@bom.local",
        password: "demo",
        role: "viewer",
        initials: "WW",
        createdAt: twoDaysAgo
      }
    ],
    sessions: []
  };
}
