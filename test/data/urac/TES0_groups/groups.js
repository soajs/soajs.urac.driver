let records = [
    {
        locked: true,
        code: "owner",
        name: "Owner Group",
        owner: true,
        description: "this is the owner group",
        config: {
            allowedPackages: {
                DSBRD: [
                    "DSBRD_OWNER"
                ]
            }
        },
        tenant: {
            id: "5c0e74ba9acc3c5a84a51259",
            code: "TES0"
        }
    },
    {
        locked: true,
        code: "devop",
        name: "Devop Group",
        owner: true,
        description: "this is the devop group",
        config: {
            allowedPackages: {
                DSBRD: [
                    "DSBRD_OWNER"
                ]
            }
        },
        tenant: {
            id: "5c0e74ba9acc3c5a84a51259",
            code: "TES0"
        }
    }
];