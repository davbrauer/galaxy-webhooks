$(document).ready(function() {

    var SwitchtourView = Backbone.View.extend({

        parent: $('.full-content'),

        el: '#switchtour',

        button: _.template(
            '<div id="switchtour-masthead">' +
                '<button id="switchtour-button"><%= text %></button>' +
            '</div>'
        ),

        menu: _.template(
            '<div id="switchtour-menu">' +
                '<div id="switchtour-text"></div>' +
                '<br>' +
                '<div id="switchtour-checkbox" align="left"></div>' +
                '<br>' +
                '<button id="switchtour-submit">Submit</button>' +
                '<div id="switchtour-download">' +
                    '<br>' +
                    '<h4>Download current</h4>' +
                    '<button id="switchtour-workflow">Workflow</button>' +
                    '&nbsp' +
                    '<button id="switchtour-commands">Commands</button>' +
                    '&nbsp' +
                    '<button id="switchtour-bibtex">Citations</button>' +
                '</div>' +
            '</div>'
        ),

        checkbox: _.template(
            '<label class="switchtour-mouseover">' +
                '<iframe src="<%= url %>" class="switchtour-help" id="switchtour-help-<%= value %>" onmouseout=\'$("#switchtour-help-<%= value %>").css("display", "none");\'></iframe>' +
                '<input type="radio" name="switchtour-select" value="<%= value %>">' +
                '<text onmouseover=\'$(".switchtour-help").css("display", "none"); $("#switchtour-help-<%= value %>").css("display", "block");\'>' +
                    '<%= description %>' +
                '</text>' +
            '</label>' +
            '<br>'
        ),

        text: _.template(
            '<h3><%= header %></h3>' +
            '<b><%= text %></b>'
        ),

        initialize: function () {
            this.render();
            this.register();
        },

        render: function() {
            this.parent.prepend(this.menu({header: 'header', text: 'text'}));
            this.removeMenu();
            this.$el.html(this.button({text: 'de.STAIR Guide'}));
        },

        // builtin alternative to registerEvents
        // events: {
        //     'click #switchtour-button': 'invoke'
        // },
        register: function() {
            var self = this;

            // this.parent.find('ul #switchtour a').on('click', function(e) {
            this.$el.on('click', function(e) {
                e.stopPropagation();
                var element = document.getElementById('switchtour-button');
                var buttontext = element.textContent || element.innerText;
                if ( buttontext === 'Abort' || buttontext === 'End' ){
                    self.abort();
                } else {
                    self.invoke();
                }
            });

            this.parent.on('keydown', function(e) {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    var element = document.getElementById('switchtour-button');
                    var buttontext = element.textContent || element.innerText;
                    if ( buttontext === 'Abort' || buttontext === 'End' ){
                        self.abort();
                    } else {
                        self.invoke();
                    }
                }
            });

            $('#switchtour-submit').on('click', function(e) {
                e.stopPropagation();
                self.runSelection();
            });

            $('#switchtour-workflow').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_workflow'}, function(ret) {
                    self.download('workflow.yaml',ret.data.workflow);
                });
            });

            $('#switchtour-commands').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_commands'}, function(ret) {
                    self.download('commands.sh',ret.data.commands);
                });
            });

            $('#switchtour-bibtex').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_bibtex'}, function(ret) {
                    self.download('citations.bib',ret.data.bibtex);
                });
            });
        },

        showMenu: function() {
            $('#columns').css('filter', 'blur(5px)');
            $('#columns').css('pointer-events', 'none');
            $('#switchtour-menu').show();
        },

        removeMenu: function() {
            $('#columns').css('filter', 'none');
            $('#columns').css('pointer-events', 'auto');
            $('#switchtour-menu').hide();
        },

        abort: function() {
            this.$el.html(this.button({text: 'Restart'}));
            this.removeMenu();
            tourcounter = 0;
            if (typeof tour !== 'undefined' && ! tour.ended()) {
                tour.end();
            }
        },

        invoke: function() {
            var self = this;
            $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: ''}, function(ret) {
                if (ret.success) {
                    if (tourcounter > 0) {
                        $.getJSON(Galaxy.root + 'api/tours', function(tour) {
                            var choices = '';
                            var regex = new RegExp(tourprefix + '_' + tourcounter);
                            var url = Galaxy.root + 'static/welcome.html';
                            for( var i in tour ) {
                                if( regex.test(tour[i].id) ) {
                                    $.ajax({
                                        url: Galaxy.root + 'static/test.html',
                                        async: false,
                                        success: function() {
                                            url = Galaxy.root + 'static/test.html';
                                            $.ajax({
                                                url: Galaxy.root + 'static/'+ tour[i].id + '.html',
                                                async: false,
                                                success: function() {
                                                    url = Galaxy.root + 'static/'+ tour[i].id + '.html'
                                                }
                                            });
                                        }
                                    });
                                    choices = choices.concat(self.checkbox({value: tour[i].id, description: tour[i].description, url: url}));
                                }
                            }
                            if(choices){
                                $('#switchtour-text').html(self.text({header: 'Please select a tool', text: ''}));
                                $('#switchtour-submit').show();
                            } else {
                                switchtour.$el.html(switchtour.button({text: 'End'}));
                                $('#switchtour-submit').hide();
                                $('#switchtour-text').html(self.text({header: 'Success!', text: 'You completed this tour!<br>Please do not forget to...'}));
                            }
                            $('#switchtour-checkbox').html(choices);
                            $('#switchtour-download').show();
                            self.showMenu();
                        });
                    } else {
                        self.$el.html(self.button({text: 'Abort'}));
                        $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'new_history'}, function(ret) {
                            // Galaxy.currHistoryPanel.refreshContents(); does not work
							$('#history-refresh-button').click();
                        });
                        $.getJSON(Galaxy.root + 'api/tours', function(tour) {
                            var choices = '';
                            var regex = new RegExp('destair_linker');
                            var url = Galaxy.root + 'static/welcome.html';
                            for( var i in tour ) {
                                if( regex.test(tour[i].id) ) {
                                    $.ajax({
                                        url: Galaxy.root + 'static/test.html',
                                        async: false,
                                        success: function() {
                                            url = Galaxy.root + 'static/test.html';
                                            $.ajax({
                                                url: Galaxy.root + 'static/'+ tour[i].id + '.html',
                                                async: false,
                                                success: function() {
                                                    url = Galaxy.root + 'static/'+ tour[i].id + '.html'
                                                }
                                            });
                                        }
                                    });
                                    choices = choices.concat(self.checkbox({value: tour[i].tags[0], description: tour[i].description, url: url}));
                                }
                            }
                            $('#switchtour-text').html(self.text({header: 'Welcome to de.STAIR guide', text: 'Which type of analysis do you want to perform?'}));
                            $('#switchtour-checkbox').html(choices);
                            $('#switchtour-submit').show();
                            $('#switchtour-download').hide();
                            self.showMenu();
                        });
                    }
                } else {
                    alert("Please login first");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                }
            });
        },

        download: function(filename, data) {
            var blob = new Blob([data], {type: 'application/octet-stream'});
            var e = document.createElement('a');
            document.body.appendChild(e);
            e.href = window.URL.createObjectURL(blob);
            e.download = filename; // works without document.body.appendChild(e); but then no dl dialog firefox
            e.click();
            document.body.removeChild(a);
        },

        runSelection: function (){
            var self = this;
            var tourid = $("input[name='switchtour-select']").filter(':checked').val();
            if (tourid && tourcounter == 0) {
                tourprefix = tourid; // from destair_linker
                tourcounter++;
                $("input[name='switchtour-select']").prop('checked', false);
                this.invoke();
            } else if (tourid) {                
                tourcounter++;
                this.removeMenu();
                $.getJSON( Galaxy.root + 'api/tours/' + tourid, function( data ) {
                    var tourdata = hooked_tour_from_data(data);
                    sessionStorage.setItem('activeGalaxyTour', JSON.stringify(data));
                    tour = new Tour(_.extend({
                        steps: tourdata.steps,
                    }, tour_opts));
                    tour.restart();
                });
            }
        },

    });

    var switchtour = new SwitchtourView();
    var Galaxy = window.bundleEntries.getGalaxyInstance();
//	for(var k in Galaxy) {
//		v = Galaxy[k];
//		console.log(k,v);
//	}
//  Galaxy.currHistoryPanel.refreshContents(); switchToHistory() createNewHistory()   

    var tourcounter = 0;
    var tourprefix = '';
    var tour;

    var hooked_tour_from_data = function (data) {
        _.each(data.steps, function (step) {
            if (step.preclick){
                step.onShow = function(){
                    _.each(step.preclick, function(preclick){
                        $(preclick).click();
                    });
                };
            }
            if (step.postclick){
                step.onHide = function(){
                    _.each(step.postclick, function(postclick){
                        $(postclick).click();
                    });
                };
            }
            if (step.textinsert){
                step.onShown= function(){
                    $(step.element).val(step.textinsert).trigger("change");
                };
            }
        });
        return data;
    };

    var tour_opts = {
        storage: window.sessionStorage,

        onEnd: function(){
            sessionStorage.removeItem('activeGalaxyTour');
            var step = tour.getStep(tour.getCurrentStep()+1);
            if (typeof step === 'undefined') {
                switchtour.invoke();
            } else {
                alert("Aborted");
                tourcounter = 0;
                switchtour.$el.html(switchtour.button({text: 'Restart'}));
            }
        },

        delay: 150,

        orphan: true,

        onNext: function(){
            var step = tour.getStep(tour.getCurrentStep()+1);
            if (typeof step === 'undefined') {
                tour.end();
                switchtour.invoke();
            }
        }
    };
});
