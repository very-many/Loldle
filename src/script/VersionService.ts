export class VersionManager {
    private static currentVersion: string | null = null;

    private static async fetchAndSetVersion(): Promise<string> {
        if (this.currentVersion) {
            return this.currentVersion;
        }

        let version;
        let versionIndex = 0;
        let response;

        do {
            const versions = await fetch(
                "http://ddragon.leagueoflegends.com/api/versions.json"
            ).then(r => r.json());
            
            version = versions[versionIndex++];
            response = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`
            );
            
            console.log(`Testing version ${version}... Status: ${response.status}`);
        } while (!response.ok);

        this.currentVersion = version;
        return version;
    }

    public static async getCurrentVersion(): Promise<string> {
        if (!this.currentVersion) {
            return await VersionManager.fetchAndSetVersion();
        }
        return this.currentVersion;
    }
}