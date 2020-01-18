(function(){

    /**
     * Global Constant
     */
    const API_HOST = 'https://uri-feeling.bab2min.pe.kr:8193';
    const EMOTION_LIST = [
        {id:'happy', name:'기쁨', css:'success'},
        {id:'sad', name:'슬픔', css:'primary'},
        {id:'angry', name:'분노', css:'danger'},
        {id:'hate', name:'혐오', css:'dark'},
        {id:'neutral', name:'중립', css:'info'},
        {id:'unk', name:'모르겠음', css:'warning'},
        {id:'info', name:'정보', css:'light'},
    ];
    const EMOTION_BTN_TMP = '<div class="col-12 col-sm-6 col-md-6 col-lg-4 emotion-btn-wrap"><button type="button" class="emotion-btn btn btn-{css} btn-lg btn-block" data-value="{id}">{name}</button></div>';
    const URL_PAT = {
        next_label: ['doc_id'],
        label: ['doc_id'],
        view: ['user_id', 'doc_id'],
    };

    var urlParams = null, loginSession = null;
    /**
     * Page Events
     */
    var onPageLoad = {};
    onPageLoad.next_label = function() {
        /*if(!loginSession) {
            location.href = API_HOST + '/login?redirect_uri=';// + encodeURIComponent(location.pathname);
            return;
        }*/
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('GET', API_HOST + '/doc/' + (urlParams.doc_id || 'random'));
        xhr.onload = function() {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                $('#label-doc').text(res.content);
                urlParams = {page:'label', doc_id:res.doc_id};
                history.replaceState(urlParams, urlParams.page, toURLParam(urlParams));
                onUpdateState();
            } else {
                
            }
        };
        xhr.send();
    };

    onPageLoad.label = function() {
        if(!$('#label-doc').text().trim()) {
            urlParams.page = 'next_label';
            $('.main-cont').hide();
            $('#main-cont-next_label').show();
            onPageLoad[urlParams.page](urlParams);
        }
    };

    $('#emotion-list').on('click', '.emotion-btn', function(){
        if(!urlParams.doc_id) return;
        if(!loginSession) {
            location.href = API_HOST + '/login?redirect_uri=';// + encodeURIComponent(location.pathname);
            return;
        }

        var data = $(this).attr('data-value');
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('POST', API_HOST + '/doc/' + urlParams.doc_id);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (xhr.status === 200) {
                urlParams = {page:'next_label'};
                history.pushState(urlParams, urlParams.page, toURLParam(urlParams));
                onUpdateState();
            } else {
                
            }
        };
        xhr.send(encodeURI('emotion=' + data));
    });

    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
        onUpdateState();
    })();

    /**
     * Utilities
     */
    function toURLParam(urlParams) {
        if(!urlParams) return '';
        var s = '';
        for(var k in urlParams) {
            s += (s ? '&' : '') + k + '=' + encodeURIComponent(urlParams[k]);
        }
        return '?' + s;
    }

    function fillTemplate(tmp, values) {
        for(var k in values) {
            tmp = tmp.split('{' + k + '}').join(values[k]);
        }
        return tmp;
    }

    function onUpdateState() {
        var page = urlParams['page'] || 'home';
        $('.main-cont').hide();
        $('#main-cont-' + page).show();
        if(onPageLoad[page]) onPageLoad[page]();
    }

    function updateLoginState() {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('GET', API_HOST + '/user');
        xhr.onload = function() {
            if (xhr.status === 200) {
                loginSession = JSON.parse(xhr.responseText);
                $('#user-menu').text(loginSession.gh_id);
                $('#user-menu-my-view').attr('href', '#view/' + loginSession.gh_id);
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

    /**
     * Initializing
     */
    $(function(){
        for(var i in EMOTION_LIST) {
            $('#emotion-list').append($(fillTemplate(EMOTION_BTN_TMP, EMOTION_LIST[i])));
        }

        $('body').on('click', 'a', function(e){
            if(!$(this).attr('href').match(/^#/)) return;
            var m = $(this).attr('href').match(/^#([_a-z0-9]+)(?:\/([-_a-zA-Z0-9]+))?(?:\/([-_a-zA-Z0-9]+))?/)
            var page = m[1];
            urlParams = {'page': page};
            if(URL_PAT[page]) {
                for(var i in URL_PAT[page]) {
                    if(! m[(i|0) + 2]) break;
                    urlParams[URL_PAT[page][i]] = m[(i|0) + 2];
                }
            } else {
                if(m[2]) urlParams['param1'] = m[2];
                if(m[3]) urlParams['param2'] = m[3];
            }
            history.pushState(urlParams, page, toURLParam(urlParams));
            onUpdateState();
            e.preventDefault();
        });
        updateLoginState();
    });
}());
