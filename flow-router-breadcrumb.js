if (Meteor.isClient) {
}
var Breadcrumb = {};

var data = {}; // routes are registered here on initialization
var dataArray = []; // this is the data to render
var cakeDataArray = []; // this is the cake data to render
var inited = false; // flag for initialization

// Config
var levelConfig = {
    "listLevel": {
        depth: 1,
        order: 1
    },
    "detailsLevel": {
        depth: 2,
        order: 1
    },
    "inputLevel": {
        depth: 1,
        order: 1
    }
};

// Or...
Breadcrumb.Config = {
    homeRoute: "home",
    maxLevels: 4,
    levelConfig: levelConfig
};

// Initialize
Breadcrumb.initialize = function () {
    // Session.set("cakeCrumbs", {});
    console.log("we are initializing cakeCrumbs");
    // console.log(route);
    var r = FlowRouter.getRouteName();
    if (r != "home") {
        // this is not home, so we add the first crumb...
    }
    cakeDataArray[0] = {homeLevel: "home"};
    inited = true;
};

// Register
Breadcrumb.register = function (route) {

    if (!inited) {
        Breadcrumb.initialize();
    }

    route.options.breadcrumb.title = route.options.breadcrumb.title || 'No Title';

    data[route.name] = route;
};

Breadcrumb.generate = function (routeName) {
    // This will generate the cake crumbs
    var routeName = routeName || FlowRouter.getRouteName();
    // Get the stored route info that was registered
    // this is where we hook into Session();
    // var cakeRoute = Session.get("cakeCrumbs");
    // console.log("are we getting cakeCrumbs?");
    // console.log(cakeRoute);
    // Gets the registered route data
    var getRouter = data[routeName];
    var level = getRouter.options.breadcrumb.level || null;
    var crumbs = cakeDataArray;
    var arr = [];


    var matched;
    var numElem = 0;
    // matched = crumbs.filter(function (e, i) {
    //     console.log(i);
    //     console.log(e);
    //     if (e[level]) {
    //         // numElem = i;
    //         return true;
    //     }else {
    //         return false;
    //     }
    // });

    crumbs.forEach(function (e, i) {
        matched = (e[level]) ? i : -1;
    });
    console.log("matched elements: ");
    console.log(matched);
    // console.log("the matched element number");
    // console.log(numElem);
    // if (matched.length > 0) {
        // console.log("FIND THE ELEMENT PLEASE");
        // console.log(crumbs.indexOf(matched));


    // }

    // var theElem = cakeDataArray.indexOf(getRouter.options.breadcrumb.level);
    console.log("the existing cakeCrumbs array");
    console.log(cakeDataArray);
    if (!matched || matched <= 0) {
        // there is no element
        console.log("there is no existing top level element for this route level");
        // console.log(cakeDataArray);
        console.log(level);
        // console.log(theElem);
    } else {
        // these is an element
        console.log("there is an existing top level element");
        arr = cakeDataArray && cakeDataArray[matched] && cakeDataArray[matched][level] || []; // get array for this level
    }

    var isInArray = arr.indexOf(getRouter.name);
    if (isInArray < 0) {
        // there is no array element of this name
        console.log("this route was not in the level");
        arr.push(getRouter.name);
    } else {
        // there is an element with this name
        console.log("this route WAS in the level");
        arr[isInArray] = getRouter.name;
    }
    var e = Math.max(matched, 1);
    console.log("this is the new element");
    console.log(e);
    var updater = {};
    updater[getRouter.options.breadcrumb.level] = arr;
    cakeDataArray[e] = updater;
    console.log("cakeDataArray:");
    console.log(cakeDataArray);
    // process the cake
};

// Render. NOTE: Currently never called with routeName
Breadcrumb.render = function (routeName) {
    // This function gets the route data,
    // and recursively checks for parent data as defined
    // in the route definition

    dataArray = []; // Clear data array for the first time
    // cakeDataArray = []; // WE WANT THIS TO PERSIST

    // Always uses routeName
    var routeName = routeName || FlowRouter.getRouteName();

    // Gets the registered route data
    var getRouter = data[routeName];

    // Gen route url
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

    // Gen route url
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
 // NOTE: This runs once for every defined route, to 
 // propagate the data[] object above
FlowRouter.onRouteRegister(function (route) {
    if (route.options.breadcrumb) {
        Breadcrumb.register(route);
    }
});

/**
 * Global Template helper
 */
Template.registerHelper('breadcrumb', function () {
    Breadcrumb.generate();
    return Breadcrumb.render();
});
