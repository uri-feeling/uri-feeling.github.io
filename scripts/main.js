(function(){

    /**
     * Global Constant
     */
    const API_HOST = 'https://uri-feeling.bab2min.pe.kr:8193';
    const EMOTION_LIST = [
        {id:'unk', name:'모르겠음', css:'warning'},
        {id:'happy', name:'기쁨/즐거움', css:'success'},
        {id:'sad', name:'슬픔', css:'primary'},
        {id:'angry', name:'분노', css:'danger'},
        {id:'hate', name:'혐오/싫음', css:'dark'},
        {id:'synical', name:'냉소/비꼼', css:'secondary'},
        {id:'sorry', name:'미안함', css:'warning'},
        {id:'info', name:'정보', css:'light'},
    ];
    const POLARITY_LIST = [
        {id:'unk', name:'모르겠음', css:'warning'},
        {id:'positive', name:'긍정', css:'success'},
        {id:'neutral', name:'중립', css:'info'},
        {id:'negative', name:'부정', css:'danger'},
    ];
    const URL_PAT = {
        next_label: ['doc_id'],
        label: ['doc_id'],
        view: ['user_id', 'doc_id'],
    };

    var urlParams = null, loginSession = null;
    var curDocId = null, selectedPolarity = null;
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
                curDocId = res.doc_id;
                history.replaceState(urlParams, urlParams.page, toURLParam(urlParams));
                $('#main-cont-label .emotion').hide();
                $('#main-cont-label .polarity').show();
                onUpdateState();
            } else {
                
            }
        };
        xhr.send();
    };

    onPageLoad.label = function() {
        if(curDocId != urlParams.doc_id) {
            urlParams.page = 'next_label';
            $('.main-cont').hide();
            $('#main-cont-next_label').show();
            onPageLoad[urlParams.page](urlParams);
        }
    };

    onPageLoad.rank = function() {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('GET', API_HOST + '/rank');
        xhr.onload = function() {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                $('#rank-list').html('');
                for(var i in res.users) {
                    var vals = res.users[i];
                    vals.contrib_cnt = numberWithCommas(vals.contrib_total);
                    vals.rank = (i|0) + 1;
                    $('#rank-list').append($(fillTemplate('#tmp-rank-item', vals)));
                    var rid = '#rank-item-' + ((i|0)+1);
                    updateAvatar(vals.gh_id, $(rid + ' .avatar'), $(rid + ' .avatar-link'));
                }
            } else {
                
            }
        };
        xhr.send();
    };

    $('#polarity-list').on('click', '.emotion-btn', function(){
        if(!urlParams.doc_id) return;

        selectedPolarity = $(this).attr('data-value');
        $('#main-cont-label .emotion').show();
        $('#main-cont-label .polarity').hide();
    });

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
        xhr.send(encodeURI('emotion=' + data + '&polarity=' + selectedPolarity));
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

    function fillTemplate(tmp_id, values) {
        var tmp = $(tmp_id).html();
        for(var k in values) {
            tmp = tmp.split('{{' + k + '}}').join(values[k]);
        }
        return tmp;
    }

    function onUpdateState() {
        var page = urlParams['page'] || 'home';
        $('#main-nav').removeClass('show');
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
                updateGHInfo();
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

    function updateGHInfo() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.github.com/users/' + loginSession.gh_id);
        xhr.onload = function() {
            if (xhr.status === 200) {
                loginSession.gh_info = JSON.parse(xhr.responseText);
                $('#user-menu').prepend($('<img>').attr('src', loginSession.gh_info.avatar_url).addClass('avatar'));
            } else {
            }
        };
        xhr.send();
    }

    function updateAvatar(gh_id, img_element, link_element) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.github.com/users/' + gh_id);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                if(img_element) img_element.attr('src', res.avatar_url);
                if(link_element) link_element.attr('href', res.html_url);
            } else {
            }
        };
        xhr.send();
    }

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Initializing
     */
    $(function(){
        for(var i in POLARITY_LIST) {
            $('#polarity-list').append($(fillTemplate('#tmp-emotion-btn', POLARITY_LIST[i])));
        }

        for(var i in EMOTION_LIST) {
            $('#emotion-list').append($(fillTemplate('#tmp-emotion-btn', EMOTION_LIST[i])));
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
