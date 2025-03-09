// This script determines whether Stardown's version number is correctly formatted.

import { VERSION, stableReleaseTagPattern, prereleaseTagPattern } from '../src/version.js';

async function main() {
    const isStableVersion = stableReleaseTagPattern.test(VERSION);
    const isPrereleaseVersion = prereleaseTagPattern.test(VERSION);

    // validate the format
    if (!isStableVersion && !isPrereleaseVersion) {
        console.error("❌ Stardown's version must match either of the two regular expressions");
        process.exit(1);
    }

    if (isPrereleaseVersion) {
        // validate the year, month, day, and hour
        const versionYYMMDDhh = VERSION.slice(-10, -2);

        const now = new Date();
        const currentYear = String(now.getUTCFullYear()).slice(2);
        const currentMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getUTCDate()).padStart(2, '0');
        const currentHour = String(now.getUTCHours()).padStart(2, '0');
        const expectedYYMMDDhh = `${currentYear}${currentMonth}${currentDay}${currentHour}`;

        if (expectedYYMMDDhh !== versionYYMMDDhh) {
            const currentMinute = String(now.getUTCMinutes()).padStart(2, '0');
            console.error(`❌ Expected ${expectedYYMMDDhh}__ but got ${versionYYMMDDhh}__\nUse ${expectedYYMMDDhh}${currentMinute}`);
            process.exit(1);
        }
    }

    console.log("✅ The version's format is correct");
    process.exit(0);
}

main();
