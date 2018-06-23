/*******************************************************************************

    Conversion script entry point.

    Author: LiCybora
 */
"use strict";

const assert = require("assert");
const stg = require("./src/stg.js");
const pv = require("./src/pv.js");

(async () => {
	const argv = process.argv.slice(2);
	let action = null;
	let filename = null;
	for (const arg of argv) {
		switch (arg) {
			case "--pv":
				assert(action === null);
				action = "pv";
				break;
			case "--stg":
				assert(action === null);
				action = "stg";
				break;
			default:
				assert(filename === null);
				if (arg.indexOf(".json") !== -1) {
					filename = arg;
				}
		}	
	}

	assert(filename !== null);
	if (action === null) {
		if (filename.indexOf("panoramaView") !== -1) {
			action = "pv";
		} else if (filename.indexOf("simple-tab-groups") !== -1) {
			action = "stg";
		} else {
			throw new Error("Groups file from unknown addons, please specify it");
		}
	}

	assert(action !== null);
	switch (action) {
		case "pv":
			pv.convert(filename);
			break;
		case "stg":
			stg.convert(filename);
			break;
		default:
			assert(false);
	}
    console.log("Conversion done! Your converted backup is tabGroups-backup.json");

})();
