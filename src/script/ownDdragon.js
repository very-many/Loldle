class Champions {
    constructor(version) {
        this.version = version;
    }

    async fetchData() {
        try {
            const response = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/championFull.json`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            this.championsData = data.data;
            console.log("Fetched champion data:", data);
        } catch (error) {
            console.error("Error fetching champion data:", error);
        }
    }

    async parse() {
        if (!this.championsData) {
            await this.fetchData();
        }

        return this.mapData(this.championsData);
    }

    /* async mapData(champions) {
        const mappedData = [];
        const genderPromises = [];

        for (const champKey in champions) {
            if (champions.hasOwnProperty(champKey)) {
                const champion = champions[champKey];
                // Start fetching gender (don't await yet)
                const genderPromise = this.getGender(champion.id);
                genderPromises.push({ promise: genderPromise, champion: champion });
            }
        }

        // Wait for all genders at once
        const genderResults = await Promise.all(genderPromises.map(item => item.promise));

        // Assemble final data
        genderResults.forEach((gender, index) => {
            const champion = genderPromises[index].champion;

            mappedData.push({
                id: champion.id,
                name: champion.name,
                title: champion.title,
                resource: champion.partype,
                genre: champion.tags.join(","),
                skinCount: champion.skins.length,
                image: champion.image,
                gender: gender,
                attackType: this.getAttackType(champion),
            });

            console.log(`✅ Mapped ${champion.name} as ${gender}`);
        });

        return mappedData;
    } */


    //What do i know if this works correctly?! It kinda just does things, idc that much XD
    async mapData(champions) {
        const mappedData = [];
        const championArray = Object.values(champions);
    
        // Fetch release dates once!
        const releaseDates = await this.fetchReleaseDates();
    
        const genders = await concurrentMap(championArray, async (champion) => {
            return {
                champion,
                gender: await this.getGender(champion.id),
            };
        }, 10); // Fetch genders 10 at a time!
    
        genders.forEach(({ champion, gender }) => {
            const releaseDate = releaseDates[champion.name] || null;
    
            mappedData.push({
                id: champion.id,
                name: champion.name,
                title: champion.title,
                resource: champion.partype,
                genre: champion.tags.join(","),
                skinCount: champion.skins.length,
                image: champion.image,
                gender: gender,
                attackType: this.getAttackType(champion),
                releaseDate: releaseDate,
            });
    
            console.log(`✅ Mapped ${champion.name} (gender: ${gender}, release: ${releaseDate})`);
        });
    
        return mappedData;
    }
    

    getAttackType(champion) {
        const attackRange = champion.stats.attackrange;
        return attackRange < 350 ? "close" : "range";
    }

    async getGender(championId) {
        let processedId = championId;
        if (championId === "Renata") {
            processedId = "renataglasc";
        }

        try {
            const response = await fetch(
                `https://universe-meeps.leagueoflegends.com/v1/en_us/champions/${processedId.toLowerCase()}/index.json`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const loreData = await response.json();
            const bio =
                loreData.champion?.biography?.full
                    ?.toLowerCase()
                    .split(/\s+/) || [];

            const maleKeywords = new Set(["he", "him", "his"]);
            const femaleKeywords = new Set(["she", "her", "hers"]);

            let maleCount = 0;
            let femaleCount = 0;

            bio.forEach((word) => {
                if (maleKeywords.has(word)) maleCount++;
                if (femaleKeywords.has(word)) femaleCount++;
            });

            if (maleCount > femaleCount) {
                return "male";
            } else if (femaleCount > maleCount) {
                return "female";
            } else {
                return "divers";
            }
        } catch (error) {
            console.error(`Error fetching lore for ${championId}:`, error);
            return "divers";
        }
    }

    async fetchReleaseDates() {
        try {
            const response = await fetch("https://leagueoflegends.fandom.com/wiki/List_of_champions");
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
    
            const releaseDates = {};
    
            const table = doc.querySelector("table.article-table tbody");
            if (table) {
                const rows = table.querySelectorAll("tr");
                rows.forEach(row => {
                    const columns = row.querySelectorAll("td");
                    if (columns.length >= 3) {
                        const championLink = columns[0].querySelector("a");
                        if (championLink) {
                            const championName = championLink.title.replace("/LoL", "");
                            const yearText = columns[2].textContent.trim().slice(0, 4);
                            const year = parseInt(yearText);
                            if (!isNaN(year)) {
                                releaseDates[championName] = year;
                            }
                        }
                    }
                });
            }
    
            return releaseDates;
    
        } catch (error) {
            console.error("Error fetching release dates:", error);
            return {};
        }
    }
    
}

async function concurrentMap(items, mapper, concurrency = 10) {
    const results = [];
    const executing = [];

    for (const item of items) {
        const p = Promise.resolve().then(() => mapper(item));
        results.push(p);

        if (concurrency <= items.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(results);
}

// Instantiate and run
const championFetcher = new Champions("15.8.1");
championFetcher.parse().then((champions) => {
    console.log("Final mapped champions:", champions);
});
