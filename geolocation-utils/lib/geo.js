'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EARTH_RADIUS = undefined;
exports.isEqual = isEqual;
exports.isLatLon = isLatLon;
exports.isLatLng = isLatLng;
exports.isLatitudeLongitude = isLatitudeLongitude;
exports.isLonLatTuple = isLonLatTuple;
exports.getLocationType = getLocationType;
exports.createLocation = createLocation;
exports.toLatLon = toLatLon;
exports.toLatLng = toLatLng;
exports.toLatitudeLongitude = toLatitudeLongitude;
exports.toLonLatTuple = toLonLatTuple;
exports.getLongitude = getLongitude;
exports.getLatitude = getLatitude;
exports.moveTo = moveTo;
exports.headingDistanceTo = headingDistanceTo;
exports.headingTo = headingTo;
exports.distanceTo = distanceTo;
exports.insideBoundingBox = insideBoundingBox;
exports.insidePolygon = insidePolygon;
exports.insideCircle = insideCircle;
exports.normalizeHeading = normalizeHeading;
exports.normalizeLatitude = normalizeLatitude;
exports.normalizeLongitude = normalizeLongitude;
exports.normalizeLocation = normalizeLocation;
exports.average = average;
exports.getBoundingBox = getBoundingBox;

var _pointInPolygon = require('point-in-polygon');

var _pointInPolygon2 = _interopRequireDefault(_pointInPolygon);

var _convert = require('./convert');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var EARTH_RADIUS = exports.EARTH_RADIUS = 6378137; // Earth's radius in meters

/**
 * Test whether two locations are equal or approximately equal
 * @param {Location} location1     A location in any of the supported location formats
 * @param {Location} location2     A location in any of the supported location formats
 * @param {number} [epsilon=0]     The maximum absolute difference between the
 *                                 two latitudes and between the two longitudes.
 *                                 Use for example 1e-12 to get rid of round-off errors.
 *                                 The epsilon value itself is included.
 *                                 Optional, default value is 0.
 */
function isEqual(location1, location2) {
  var epsilon = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  return location1 && location2 ? Math.abs(getLatitude(location1) - getLatitude(location2)) <= epsilon && Math.abs(getLongitude(location1) - getLongitude(location2)) <= epsilon : false;
}

/**
 * Test whether an object is an object containing numeric properties `lat` and `lon`
 * @param {*} object Anything
 * @param {boolean} Returns true when object is of type LatLon
 */
function isLatLon(object) {
  return !!object && typeof object.lat === 'number' && typeof object.lon === 'number';
}

/**
 * Test whether an object is an object containing numeric properties `lat` and `lng`
 * @param {*} object Anything
 * @param {boolean} Returns true when object is of type LatLng
 */
function isLatLng(object) {
  return !!object && typeof object.lat === 'number' && typeof object.lng === 'number';
}

/**
 * Test whether an object is an object containing numeric properties `latitude` and `longitude`
 * @param {*} object Anything
 * @param {boolean} Returns true when object is of type LatitudeLongitude
 */
function isLatitudeLongitude(object) {
  return !!object && typeof object.latitude === 'number' && typeof object.longitude === 'number';
}

/**
 * Test whether an object is an array containing two numbers (longitude and latitude)
 * 
 * IMPORTANT: this function cannot see the difference between an array with lat/lon
 *            or an array with lon/lat numbers. It assumes an order lon/lat.
 * 
 * @param {*} object Anything
 * @param {boolean} Returns true when object is of type LonLatTuple
 */
function isLonLatTuple(object) {
  return Array.isArray(object) && typeof object[0] === 'number' && typeof object[1] === 'number';
}

/**
 * Get the type of a location object
 * @param {Location} location
 * @return {string} Returns the type of the location object
 *                  Recognized types: 'LonLatTuple', 'LatLon', 'LatLng', 'LatitudeLongitude'
 */
function getLocationType(location) {
  if (isLonLatTuple(location)) {
    return 'LonLatTuple';
  }

  if (isLatLon(location)) {
    return 'LatLon';
  }

  if (isLatLng(location)) {
    return 'LatLng';
  }

  if (isLatitudeLongitude(location)) {
    return 'LatitudeLongitude';
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Create a location object of a specific type
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} type  Available types: 'LonLatTuple', 'LatLon', 'LatLng', 'LatitudeLongitude'
 */
function createLocation(latitude, longitude, type) {
  if (type === 'LonLatTuple') {
    return [longitude, latitude];
  }

  if (type === 'LatLon') {
    return { lat: latitude, lon: longitude };
  }

  if (type === 'LatLng') {
    return { lat: latitude, lng: longitude };
  }

  if (type === 'LatitudeLongitude') {
    return { latitude: latitude, longitude: longitude };
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Convert a location into an object with properties `lat` and `lon`
 * @param {Location} location
 * @returns {LatLon}
 */
function toLatLon(location) {
  if (isLonLatTuple(location)) {
    return {
      lat: location[1],
      lon: location[0]
    };
  }

  if (isLatLon(location)) {
    return {
      lat: location.lat,
      lon: location.lon
    };
  }

  if (isLatLng(location)) {
    return {
      lat: location.lat,
      lon: location.lng
    };
  }

  if (isLatitudeLongitude(location)) {
    return {
      lat: location.latitude,
      lon: location.longitude
    };
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Convert a location into an object with properties `lat` and `lng`
 * @param {Location} location
 * @returns {LatLng}
 */
function toLatLng(location) {
  if (isLonLatTuple(location)) {
    return {
      lat: location[1],
      lng: location[0]
    };
  }

  if (isLatLon(location)) {
    return {
      lat: location.lat,
      lng: location.lon
    };
  }

  if (isLatLng(location)) {
    return {
      lat: location.lat,
      lng: location.lng
    };
  }

  if (isLatitudeLongitude(location)) {
    return {
      lat: location.latitude,
      lng: location.longitude
    };
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Convert a location into an object with properties `latitude` and `longitude`
 * @param {Location} location
 * @returns {LatitudeLongitude}
 */
function toLatitudeLongitude(location) {
  if (isLonLatTuple(location)) {
    return {
      latitude: location[1],
      longitude: location[0]
    };
  }

  if (isLatLon(location)) {
    return {
      latitude: location.lat,
      longitude: location.lon
    };
  }

  if (isLatLng(location)) {
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }

  if (isLatitudeLongitude(location)) {
    return {
      latitude: location.latitude,
      longitude: location.longitude
    };
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Convert a location into a tuple `[longitude, latitude]`, as used in the geojson standard
 * 
 * Note that for example Leaflet uses a tuple `[latitude, longitude]` instead, be careful!
 * 
 * @param {Location} location
 * @returns {LonLatTuple}
 */
function toLonLatTuple(location) {
  if (isLonLatTuple(location)) {
    return [location[0], location[1]];
  }

  if (isLatLon(location)) {
    return [location.lon, location.lat];
  }

  if (isLatLng(location)) {
    return [location.lng, location.lat];
  }

  if (isLatitudeLongitude(location)) {
    return [location.longitude, location.latitude];
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Get the longitude of a location
 * @param {Location} location
 * @return {number} Returns the longitude
 */
function getLongitude(location) {
  if (isLonLatTuple(location)) {
    return location[0];
  }

  if (isLatLon(location)) {
    return location.lon;
  }

  if (isLatLng(location)) {
    return location.lng;
  }

  if (isLatitudeLongitude(location)) {
    return location.longitude;
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Get the latitude of a location object or array
 * @param {Location} location
 * @return {number} Returns the latitude
 */
function getLatitude(location) {
  if (isLonLatTuple(location)) {
    return location[1];
  }

  if (isLatLon(location)) {
    return location.lat;
  }

  if (isLatLng(location)) {
    return location.lat;
  }

  if (isLatitudeLongitude(location)) {
    return location.latitude;
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Move to a new location from a start location, heading, and distance
 *
 * This is a rough estimation.
 *
 * Source: 
 * 
 *   http://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
 * 
 * @param {Location} from             Start location
 * @param {HeadingDistance} headingDistance   An object with property `heading` in degrees and `distance` in meters
 * @return {Location} Returns the moved location
 */
function moveTo(from, headingDistance) {
  // TODO: improve precision of this function moveTo
  var lat = getLatitude(from);
  var lon = getLongitude(from);
  var heading = headingDistance.heading,
      distance = headingDistance.distance;


  var dLat = distance * Math.cos((0, _convert.degToRad)(heading)) / EARTH_RADIUS;
  var dLon = distance * Math.sin((0, _convert.degToRad)(heading)) / (EARTH_RADIUS * Math.cos((0, _convert.degToRad)(lat)));

  return createLocation(lat + (0, _convert.radToDeg)(dLat), lon + (0, _convert.radToDeg)(dLon), getLocationType(from));
}

/**
 * Calculate the heading and distance between two locations
 *
 * Sources:
 * 
 *   http://www.movable-type.co.uk/scripts/latlong.html
 *   http://mathforum.org/library/drmath/view/55417.html
 * 
 * @param {Location} from   Start location
 * @param {Location} to     End location
 * @return {HeadingDistance}  Returns an object with `heading` in degrees and `distance` in meters
 */
function headingDistanceTo(from, to) {
  var fromLat = getLatitude(from);
  var fromLon = getLongitude(from);
  var toLat = getLatitude(to);
  var toLon = getLongitude(to);

  var lat1 = (0, _convert.degToRad)(fromLat);
  var lat2 = (0, _convert.degToRad)(toLat);
  var dlat = (0, _convert.degToRad)(toLat - fromLat);
  var dlon = (0, _convert.degToRad)(toLon - fromLon);

  var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = EARTH_RADIUS * c;

  var y = Math.sin(dlon) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon);
  var heading = (0, _convert.radToDeg)(Math.atan2(y, x));

  return { distance: distance, heading: heading };
}

/**
 * Calculate the heading from one location to another location
 * @param {Location} center 
 * @param {Location} location 
 * @return {number} Returns an heading in degrees
 */
function headingTo(center, location) {
  return headingDistanceTo(center, location).heading;
}

/**
 * Calculate the distance between two locations
 * @param {Location} center 
 * @param {Location} location 
 * @return {number} Returns the distance in meters
 */
function distanceTo(center, location) {
  return headingDistanceTo(center, location).distance;
}

/**
 * Test whether a location lies inside a given bounding box.
 * @param {Location} location
 * @param {BoundingBox} boundingBox
 *            A bounding box containing a top left and bottom right location.
 *            The order doesn't matter.
 * @return {boolean} Returns true when the location is inside the bounding box
 *                   or on the edge.
 */
function insideBoundingBox(location, boundingBox) {
  var lat = getLatitude(location);
  var lon = getLongitude(location);

  var topLeftLon = getLongitude(boundingBox.topLeft);
  var topLeftLat = getLatitude(boundingBox.topLeft);
  var bottomRightLon = getLongitude(boundingBox.bottomRight);
  var bottomRightLat = getLatitude(boundingBox.bottomRight);

  var minLat = Math.min(topLeftLat, bottomRightLat);
  var maxLat = Math.max(topLeftLat, bottomRightLat);
  var minLon = Math.min(topLeftLon, bottomRightLon);
  var maxLon = Math.max(topLeftLon, bottomRightLon);

  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

/**
 * Test whether a location lies inside a given polygon
 * @param {Location} location 
 * @param {Location[]} polygon  
 * @return {boolean} Returns true when the location is inside the bounding box
 *                   or on the edge.
 */
function insidePolygon(location, polygon) {
  if (!polygon || !Array.isArray(polygon)) {
    throw new TypeError('Invalid polygon. Array with locations expected');
  }
  if (polygon.length === 0) {
    throw new TypeError('Invalid polygon. Non-empty Array expected');
  }

  return (0, _pointInPolygon2.default)(toLonLatTuple(location), polygon.map(toLonLatTuple));
}

/**
 * Test whether a location lies inside a circle with certain radius
 * @param {Location} location 
 * @param {Location} center 
 * @param {number} radius    A radius in meters
 * @return {boolean} Returns true when the location lies inside or 
 *                   on the edge of the circle
 */
function insideCircle(location, center, radius) {
  return distanceTo(center, location) <= radius;
}

/**
 * Normalize an heading into the range [0, 360)
 * @param {number} heading   An heading in degrees
 * @return {number} Returns the normalized heading (degrees)
 */
function normalizeHeading(heading) {
  var normalized = heading % 360;

  if (normalized < 0) {
    normalized += 360;
  }

  if (normalized >= 360) {
    normalized -= 360;
  }

  return normalized;
}

/**
 * Normalize a latitude into the range [-90, 90] (upper and lower bound included)
 * 
 * See https://stackoverflow.com/questions/13368525/modulus-to-limit-latitude-and-longitude-values
 * 
 * @param {number} latitude 
 * @return {number} Returns the normalized latitude
 */
function normalizeLatitude(latitude) {
  return Math.asin(Math.sin(latitude / 180 * Math.PI)) * (180 / Math.PI);
}
/**
 * Normalize a longitude into the range (-180, 180] (lower bound excluded, upper bound included)
 * 
 * @param {number} longitude 
 * @return {number} Returns the normalized longitude
 */
function normalizeLongitude(longitude) {
  var normalized = longitude % 360;

  if (normalized > 180) {
    normalized -= 360;
  }

  if (normalized <= -180) {
    normalized += 360;
  }

  return normalized;
}

/**
 * Normalize the longitude and latitude of a location.
 * Latitude will be in the range [-90, 90] (upper and lower bound included)
 * Lontitude will be in the range (-180, 180] (lower bound excluded, upper bound included)
 * @param {Location} location 
 * @return {Location} Returns the normalized location
 */
function normalizeLocation(location) {
  if (isLonLatTuple(location)) {
    return [normalizeLongitude(location[0]), normalizeLatitude(location[1])];
  }

  if (isLatLon(location)) {
    return {
      lat: normalizeLatitude(location.lat),
      lon: normalizeLongitude(location.lon)
    };
  }

  if (isLatLng(location)) {
    return {
      lat: normalizeLatitude(location.lat),
      lng: normalizeLongitude(location.lng)
    };
  }

  if (isLatitudeLongitude(location)) {
    return {
      latitude: normalizeLatitude(location.latitude),
      longitude: normalizeLongitude(location.longitude)
    };
  }

  throw new Error('Unknown location format ' + JSON.stringify(location));
}

/**
 * Calculate the average of a list with locations
 * @param {Location[]} locations 
 * @return {Location} Returns the average location or null when the list is empty
 *                    Location has the same structure as the first location from
 *                    the input array.
 */
function average(locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return null;
  }

  var first = locations[0];
  var latitude = avg(locations.map(getLatitude));
  var longitude = avg(locations.map(getLongitude));

  return createLocation(latitude, longitude, getLocationType(first));
}

/**
 * Get the bounding box of a list with locations
 * @param {Locations[]} locations
 * @param {number} [margin]   Optional margin in meters. Zero by default.
 * @return {BoundingBox} Returns a bounding box described by it's top left 
 *                       and bottom right location
 */
function getBoundingBox(locations) {
  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  if (!Array.isArray(locations) || locations.length === 0) {
    return {
      topLeft: null,
      bottomRight: null
    };
  }

  var type = getLocationType(locations[0]);
  var topLeftLat = Math.max.apply(Math, _toConsumableArray(locations.map(getLatitude)));
  var topLeftLon = Math.min.apply(Math, _toConsumableArray(locations.map(getLongitude)));
  var bottomRightLat = Math.min.apply(Math, _toConsumableArray(locations.map(getLatitude)));
  var bottomRightLon = Math.max.apply(Math, _toConsumableArray(locations.map(getLongitude)));

  var topLeft = createLocation(topLeftLat, topLeftLon, type);
  var bottomRight = createLocation(bottomRightLat, bottomRightLon, type);

  if (margin === null || margin === 0) {
    // no margin
    return { topLeft: topLeft, bottomRight: bottomRight };
  } else {
    // add a margin in meters
    var distance = Math.SQRT2 * margin;
    return {
      topLeft: moveTo(topLeft, { heading: 315, distance: distance }),
      bottomRight: moveTo(bottomRight, { heading: 135, distance: distance })
    };
  }
}

/**
 * Calculate the average of a list with numbers
 * @param {number[]} values 
 * @return {number}
 */
function avg(values) {
  return sum(values) / values.length;
}

/**
 * calculate the sum of a list with numbers
 * @param {number[]} values 
 * @return {number} Returns the sum
 */
function sum(values) {
  return values.reduce(function (a, b) {
    return a + b;
  }, 0);
}