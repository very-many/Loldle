/* FETCHER */
import { parse } from "../../script/superNewDdragon.js";

/* SUBMIT TO DB */
import { POST } from "./submit";


const API_URL = "https://loldle-nine.vercel.app/api/submit"; 




async function postToDatabase(data) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to post data: ${response.status}`);
        }

        console.log("Data successfully posted to the database.");
    } catch (error) {
        console.error("Error posting data to the database:", error);
    }
}

export async function cron() {
    postToDatabase(await parse());
}