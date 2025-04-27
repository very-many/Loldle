let championJson = {};
//let language = localStorage.getItem("lang") || "en_US";
let language = "en_US";

async function getLatestChampionDDragon() {
    if (championJson[language]) return championJson[language];

    let response;
    let versionIndex = 0;
    do {
        // I loop over versions because 9.22.1 is broken
        const version = (
            await fetch(
                "http://ddragon.leagueoflegends.com/api/versions.json"
            ).then(async (r) => await r.json())
        )[versionIndex++];


        response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/championFull.json`
        );
    } while (!response.ok);

    championJson[language] = await response.json();
    return championJson[language];
}

export async function mapData() {
    let data = await getLatestChampionDDragon();
    data = data.data;

    const translatorByName = {};
    const translatorById = {};

    for (const key in data) {
        const champion = data[key];

        // Map by name
        translatorByName[champion.name] = {
            key: champion.key,
            id: champion.id,
        };

        // Map by id
        translatorById[champion.id] = {
            name: champion.name,
            key: champion.key,
        };
    }

    return { translatorByName, translatorById };
}

export const { translatorByName, translatorById } = await mapData();
