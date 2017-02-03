/**
 * Breadcrumbs with cakecrumb feature added.
 *
 * Cakecrumbs can be better then breadcrumbs. They are
 * dynamically generated based on the navigation history
 * of the user.
 * Crumbs are names of routes grouped into levels defined
 * in the "breadcrumb" element of the route definition.
 * These crumbs and levels can then be assiged priority
 * and other properties in the new configuration options.
 *
 * In the route breadcrumb definition use as follows:

  routeName.route("/routeName", {
   name: "routeName",
   breadcrumb: {
     title: "Route Title",
     parent: "homeRoute", // For backwards compatibility with original Breadcrumbs
     level: "level01" // New! Used by cakeCrumbs for defining dynamic ancestry
   },
   ...
  });

 *
 * Also, the cakecrumbs feature requires a configuration object to be available to the package.
 * It needs to be defined as follows:

  Breadcrumb.Config = {
    homeRoute: "home", // This route will always be at the "top" of the crumbs list
    maxLevels: 4, // Unsed for now, potential future feature
    levelsConfig: {
      "level01" : { // This is the "level" property set in the route breadcrumb definition
        depth: 1, // Unsed for now, potential future feature
        order: 1, // Unsed for now, potential future feature
        priority: 0 // Used to override lower priority crumbs (0 based). Experimental, cannot well resolve conflicts, so it is required explicitly and uniquely per level.
      },
      "level02": {
        ...
      }
    }
  };

 *
 */

if (!Breadcrumb) { var Breadcrumb = {}; };


var data = {}; // routes are registered here on initialization
var dataArray = []; // this is the data to render for breadcrumbs
var crumbArr = []; // Temporarily holds the cake crumbs
var cakeDataArray = []; // this is the cake data to render for cakecrumbs
var inited = false; // flag for initialization


// May want to try and track the crumbs in a session if they are dynamic

// Configs
var levelsConfig = {
  "homeLevel" : {
    depth: 1,
    order: 1,
    priority: 0
  },
	"listsLevel": {
		depth: 1,
		order: 1,
		priority: 1
	},
	"detailsLevel": {
		depth: 2,
		order: 1,
		priority: 2
	},
	"inputsLevel": {
		depth: 1,
		order: 1,
		priority: 3
	}
};

Breadcrumb.Config = {
	homeRoute: "home",
	maxLevels: 4,
	levelsConfig: levelsConfig
};

/* Initialize cakeCrumbs ************************* */
Breadcrumb.initialize = function () {
    // Session.set("cakeCrumbs", {});
    var r = FlowRouter.getRouteName();
    var homeRoute = Breadcrumb.Config.homeRoute;
    if (r != homeRoute) {
        // this is not homeRoute, so we add the first crumb as the homeRoute
        var routePath = data[homeRoute];
        cakeDataArray[0] = {homeLevel: [routePath]};
      }
    inited = true;
  };

/* Register route data ************************* */
Breadcrumb.register = function (route) {

	route.options.breadcrumb.title = route.options.breadcrumb.title || 'No Title';
	data[route.name] = route;

};

// Generate the crumb for cakeCrumbs
Breadcrumb.generate = function (paramsAll) {
  // This method will generate the cakeCrumbs data array

	if (!inited) {
		Breadcrumb.initialize();
	}

  var crumbs = cakeDataArray; // This is the current set of crumbs which we will update
  var routeName = paramsAll.route.name;
  var getRouter = data[routeName]; // Get registered route data
  var updater = {};

  // Update route data to newest, if existing
  for (var p in paramsAll) { 
  	if (p && getRouter) {getRouter[p] = paramsAll[p];}
  }

  // Parse route and config for relevant data
  var bCrumb = getRouter && getRouter.options && getRouter.options.breadcrumb || null;
  var level = bCrumb && bCrumb.level || null; // What if there is no level? Assume highest?
  var levelCfg = Breadcrumb.Config.levelsConfig[level] || null;
  var priority = levelCfg.priority || null;

  // Start checking the existing crumbs for matching levels and routes
  var levelMatch = crumbs.findIndex(function (e, i) {
    return (e[level] || Array.isArray(e[level]));
  });

  if (levelMatch < 0) { // '0' must return false


    if (priority < crumbs.length) {
      // This level has higher priority, override lower priority
      cakeDataArray.splice(priority)
    }

		updater[level] = [getRouter];
    cakeDataArray.push(updater);

  } else { // There is an existing crumb level

    var lvlCrumbs = crumbs[levelMatch][level];

    var routeMatch = lvlCrumbs.findIndex(function (e, i) {
      return e.name === getRouter.name;
    });

    if (routeMatch >= 0) { // '0' must return true
      lvlCrumbs.splice(routeMatch);
    }

    lvlCrumbs.push(getRouter)
    updater[level] = lvlCrumbs;

    cakeDataArray.splice(levelMatch + 1);
    cakeDataArray[levelMatch] = updater; 

  }

  Breadcrumb.renderCake(); // This forces re-render, which was not always happening

}; // END Breadcrumb.generate()

// Dynamically generate and update crumb data
Breadcrumb.renderCake = function () {

  crumbArr = []; // Clear data array
  var routeName = routeName || FlowRouter.getRouteName();

  // Loop through the level objects, and transpose into list for rendering
  for (var i = 0; i < cakeDataArray.length; i++) {
  	var ob = cakeDataArray[i];
  	var elem = ob[Object.keys(ob)[0]]; // Get the first key of the associative elements

  	// Assemble the final crumb obj
    var routes = elem.forEach(function (el, ix, arr) {
    	var obj = {};

    	obj.url = FlowRouter.path(el.name, (el.params || null), (el.queryParams || null));
    	obj.title = el.options.breadcrumb.title;

    	if (routeName === el.name) {
    		obj.activeClass = "active";
    	} else {
    		obj.activeClass = "";
    	}

      crumbArr.push(obj);

    });

  };

  return crumbArr;

};

// Recursively generate static crumb data
Breadcrumb.renderBread = function (routeName) {

    dataArray = []; // Clear data array for the first time

    var routeName = routeName || FlowRouter.getRouteName();

    // Get the registered route data
    var getRouter = data[routeName];

    // Generate route url
    var paramAndQuery = genParamAndQuery(getRouter.options.breadcrumb);
    var url = FlowRouter.path(routeName, paramAndQuery.params, paramAndQuery.queryParams);

    // Push data
    dataArray.push({
    	url: url,
    	title: getRouter.options.breadcrumb.title,
    	activeClass: 'active'
    });

    // Check parent
    if (getRouter.options.breadcrumb.parent) {
    	getParent(getRouter.options.breadcrumb.parent)
    }

    return dataArray.reverse();
  };

// Get parent router
var getParent = function (route) {
	var getRouter = data[route];

    // Generate route url
    var paramAndQuery = genParamAndQuery(getRouter.options.breadcrumb);
    var url = FlowRouter.path(route, paramAndQuery.params, paramAndQuery.queryParams);

    // Push data
    dataArray.push({
    	url: url,
    	title: getRouter.options.breadcrumb.title,
    	activeClass: ''
    });

    // Check parent parent
    if (getRouter.options.breadcrumb.parent) {
    	getParent(getRouter.options.breadcrumb.parent)
    }

    return false;
  };

// Generate param and query
var genParamAndQuery = function (breadcrumb) {
    // Check is array
    breadcrumb.params = _.isArray(breadcrumb.params) ? breadcrumb.params : [breadcrumb.params];
    breadcrumb.queryParams = _.isArray(breadcrumb.queryParams) ? breadcrumb.queryParams : [breadcrumb.queryParams];

    var params = {};
    _.each(breadcrumb.params, function (o) {
    	params[o] = FlowRouter.getParam(o);
    });
    var queryParams = {};
    _.each(breadcrumb.queryParams, function (o) {
    	queryParams[o] = FlowRouter.getQueryParam(o);
    });

    return {params: params, queryParams: queryParams};
  };

/**
 * Register to flow router
 */
 FlowRouter.onRouteRegister(function (route) {
    // This puts all route breadcrumb definitions in the data[] array;
    if (route.options.breadcrumb) {
    	Breadcrumb.register(route);
    }
  });

/**
 * Track route changes
 */
 if (Meteor.isClient) {
 	Meteor.startup(function() {
 		Tracker.autorun(function(c) {
 			FlowRouter.watchPathChange();
 			if (FlowRouter._initialized) {
            // Trigger the dynamic crumb generation on route change...
            var paramsAll = FlowRouter.current();
            Breadcrumb.generate(paramsAll);
          }
        });
 	});
 }

/**
 * Global Template helpers
 */
 Template.registerHelper('breadcrumb', function () {
 	return Breadcrumb.renderBread();
 });

 Template.registerHelper('cakecrumb', function () {
 	return Breadcrumb.renderCake();
 });
