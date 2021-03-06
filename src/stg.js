/*******************************************************************************

    Script for converting backup JSON generated by Simple Tab Groups to legacy 
    Tab Groups (by Quicksaver) format. To avoid ambiguous, terms refers to the 
    following two projects:

    Simple Tab Groups: Refer to https:/github.com/drive4ik/simple-tab-groups
    Tab Groups: Refer to https://github.com/Quicksaver/Tab-Groups 

    For easy typing, use short from STG for Simple Tab Groups, and TG for Tab 
    Groups.

    Note: NOT all information can be transformed.

    Author: LiCybora
 */
 "use strict";

const fs = require("promise-fs");

exports.convert = async (filename) => {
    let STG = await fs.readFile(filename, "utf8");
    STG = JSON.parse(STG);
    // STG is much different, better build it again.
    let tabGroups = {};
    // Mod itself as TG.
    tabGroups.version = ["tabGroups", 1];
    tabGroups.windows = [{}];
    let tabs = [];
    let tvg = {};
    let activeGroup = null;
    let slot = 1;
    STG.groups.forEach(function(group) {
        group.id += 3;   // No idea why groupId 0 is not accepted

        tvg[group.id.toString()] = {
	        // STG has no free arrange, at least for the moment this file create
            "slot": slot++,
            "id": group.id,
            "title": group.title,
            "catchRules": group.catchTabRules,
            // These are not available in STG, just create all to default value
            "stackTabs": true,
            "showThumbs": true,
            "showUrls": true,
            "tileIcons": true,
            "catchOnce": true,
        };


        group.tabs.forEach(function(tab) {
        	// Follow item in Tab Groups
        	tab.entries = [
        		{
	              "url": tab.url,
	              "title": tab.title,
	              "charset": "UTF-8",
	              "ID": tab.id,
	              "persist": true
        		}
        	];
        	// FIXME: Not sure how STG handle pinned tabs.
        	// tab.pinned = false;
        	tab.attributes = {};

            let tvt = {};        
            tvt.groupID = group.id;

            if (tab.active) {
                tvt.active = true;
            }
            tab.extData = {
                "tabview-tab" : JSON.stringify(tvt, null)
            };

        	tab.index = 1;
        	tab.image = tab.favIconUrl;
	    	if (activeGroup === null) {
	    		activeGroup = group.id;
	    		tab.hidden = false;
	    	} else {
	    		tab.hidden = (activeGroup !== group.id);
	    	}

	    	// Remove item not exist in Tab Groups
	    	delete tab.thumbnail;
        	delete tab.id;
	        delete tab.url;
	        delete tab.title;
	        delete tab.active;
	        delete tab.favIconUrl;
	        delete tab.cookieStoreId;

	    	tabs.push(tab);

        });
    });

    // STG don't even record last access
    // STG.session = {
    //     "lastUpdate": maxTimeStamp,
    //     "startTime": minTimeStmap,
    //     "recentCrashes": 0
    // }

    tabGroups.windows[0].tabs = tabs;

    let tvgs = {
        "nextID": STG.lastCreatedGroupPosition + 4,
        "activeGroupId": activeGroup, 
        "activeGroupName": tvg[activeGroup.toString()].title, 
        "totalNumber": STG.groups.length
    };

    tabGroups.windows[0].extData = {
        "tabview-group": JSON.stringify(tvg, null),
        "tabview-groups": JSON.stringify(tvgs, null)
    };

    await fs.writeFile("./tabGroups-backup.json", JSON.stringify(tabGroups, null, 2), "utf-8");
};
