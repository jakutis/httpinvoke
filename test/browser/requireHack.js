_httpinvoke = httpinvoke;
require = function(module) {
    if(module === '../config') {
        return {
            url: location.href
        };
    }
    return _httpinvoke;
};
