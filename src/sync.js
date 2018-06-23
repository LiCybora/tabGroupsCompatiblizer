/*******************************************************************************

    Script for converting backup JSON generated by Sync Tab Groups to legacy 
    Tab Groups (by Quicksaver) format. To avoid ambiguous, terms refers to the 
    following two projects:

    Sync Tab Groups: Refer to https://github.com/Morikko/sync-tab-groups
    Tab Groups: Refer to https://github.com/Quicksaver/Tab-Groups 

    For easy typing, use short from Sync for Sync Tab Groups, and TG for Tab 
    Groups.

    Note: NOT all information can be transformed.

    Author: LiCybora
 */
 "use strict";

const fs = require("promise-fs");

exports.convert = async (filename) => {
    let Sync = await fs.readFile(filename, "utf8");
    Sync = JSON.parse(Sync);
    // Sync is much different, better build it again.
    let tabGroups = {};
    // Mod itself as TG.
    tabGroups.version = ["tabGroups", 1];
    tabGroups.windows = [{}];

    // Fake session
    let maxTimeStamp = 0;
    let minTimeStmap = 1e16;

    let tabs = [];
    let tvg = {};
    let activeGroup = null;
    let slot = 1;
    let maxGID = 0;
    Sync.groups.forEach(function(group) {
        group.id += 3;   // No idea why groupId 0 is not accepted
        if (group.id > maxGID) {
            maxGID = group.id;
        }
        tvg[group.id.toString()] = {
	        // Sync has thumbnail view, at least for the moment this file create
            "slot": slot++,
            "id": group.id,
            "title": group.title,
            // These are not available in Sync, just create all to default value
            "catchRules": true,
            "stackTabs": true,
            "showThumbs": true,
            "showUrls": true,
            "tileIcons": true,
            "catchOnce": true,
        };


        group.tabs.forEach(function(tab) {
            let tvt = {
                "groupID": group.id
            };
            if (tab.active) {
                tvt.active = true;
            }
            // Follow item in Tab Groups
            let newTab = {
                "entries": [
                {
                    "url": tab.url,
                    "title": tab.title,
                    "charset": "UTF-8",
                    "ID": tab.id,
                    "persist": true
                }],
                "lastAccessed": tab.lastAccessed,
                "hidden": tab.hidden,
                "pinned": tab.pinned,
                "attributes": {},
                "extData": {
                    "tabview-tab": JSON.stringify(tvt)
                },
                "index": 1,
                "image": tab.favIconUrl
            };

            if (tab.lastAccessed > maxTimeStamp) {
                maxTimeStamp = tab.lastAccessed;
            }
            if (tab.lastAccessed < minTimeStmap) {
                minTimeStmap = tab.lastAccessed;
            }

            if (activeGroup === null && !tab.hidden) {
                // Determined currently active group
                activeGroup = group.id;
            }

	    	tabs.push(newTab);

        });
    });

    // Make fake session
    tabGroups.session = {
        "lastUpdate": maxTimeStamp,
        "startTime": minTimeStmap,
        "recentCrashes": 0
    };

    tabGroups.windows[0].tabs = tabs;

    let tvgs = {
        "nextID": maxGID + 1,
        "activeGroupId": activeGroup, 
        "activeGroupName": tvg[activeGroup.toString()].title, 
        "totalNumber": Sync.groups.length, 
    };

    tabGroups.windows[0].extData = {
        "tabview-group": JSON.stringify(tvg, null),
        "tabview-groups": JSON.stringify(tvgs, null)
    };

    await fs.writeFile("./tabGroups-backup.json", JSON.stringify(tabGroups, null, 2), "utf-8");
};