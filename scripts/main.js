(function(){
    const API_HOST = 'https://uri-feeling.bab2min.pe.kr:8193'

    var urlParams = null, loginSession = null;
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
        onUpdateState(urlParams);
    })();

    function toURLParam(urlParams) {
        if(!urlParams) return '';
        var s = '';
        for(var k in urlParams) {
            s += (s ? '&' : '') + k + '=' + encodeURIComponent(urlParams[k]);
        }
        return '?' + s;
    }

    function onUpdateState(urlParams) {
        var page = urlParams['page'] || 'home';
        $('.main-cont').hide();
        $('#main-cont-' + page).show();
    }

    function updateLoginState() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', API_HOST + '/user');
        xhr.onload = function() {
            if (xhr.status === 200) {
                loginSession = JSON.parse(xhr.responseText);
                $('#btn-login').hide();
                $('#btn-logout').show();
            } else {
                loginSession = null;
                $('#btn-login').show();
                $('#btn-logout').hide();
            }
        };
        xhr.send();
    }

    $(function(){
        $('body').on('click', 'a', function(e){
            if(!$(this).attr('href').match(/^#/)) return;
            var page = $(this).attr('href').substr(1);
            urlParams = {'page':page};
            history.pushState(urlParams, page, toURLParam(urlParams));
            onUpdateState(urlParams);
            e.preventDefault();
        });
        updateLoginState();
    });
}());
