/**
 * Created by alexey.kozyachiy on 8/28/15.
 */
(function ($) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };

    function getProjectById(id) {
        return Projects.filter(function (p) {
            return p.id == id;
        })[0];
    }

    function getProjectByIndex(arr, i) {
        return arr.filter(function (p, index) {
            return index == i;
        })[0];
    }

    var Projects = [];

    function Project(p) {
        var self = this;
        this.id = p.id;
        this.name = p.name;
        this.description = p.description;
        this.active = p.active;
        this.start_date = p.start_date;
        this.end_date = p.end_date;
        this.current_step = p.current_step;
        this.total_steps = p.total_steps;
        this.owner = {name: p.owner.name, image: p.owner.image};
        Object.defineProperty(this, 'startDate', {
            get: function () {
                return moment.unix(self.start_date).format('ll');
            }
        });
        Object.defineProperty(this, 'endDate', {
            get: function () {
                return moment.unix(self.end_date).format('ll');
            }
        });
        this.getProjectPeriod = function () {
            return moment(this.startDate, 'll').format('L') + ' to ' + moment(this.endDate, 'll').format('L');
        };
        this.getPercentComplete = function () {
            var total = this.total_steps;
            var current = this.current_step;
            return current * 100 / total;
        };
        this.getRation = function () {
            var total = this.total_steps;
            var current = this.current_step;
            return current + '/' + total;
        };
    }

    function ProjectTable(data) {
        var self = this;
        this.projects = data;
        this.element = $('#projectTable');
        this.populateTable = function (addProject) {
            //function creates table rows
            this.projects.forEach(function (p) {
                addProject(self.element.find('tbody'), p);
            });
            return self;
        };
        this.renderTableComponents = function () {
            //function generates jQuery components for each table row
            $('.step-bar.small').each(function (index, element) {
                var project = getProjectByIndex(self.projects, index);
                $(element).stepBar('create', project);
            });
            $('.activity').each(function (index, element) {
                var project = getProjectByIndex(self.projects, index);
                $(element).activity(project.active);
            });
            return self;
        };
        this.attachTableEvents = function (handler) {
            var $body = $('body');
            $body.on('click', 'a.link', handler)
                //event is fired when click in the project name link to go to item view
                .on('tr:update', 'tbody tr', function (e, projectId) {
                    //event is fired when table row is needed to be updated
                    var $el = $(e.currentTarget);
                    var p = self.getProjectById(projectId);
                    $el.find('#' + p.id).text(p.name);
                    $el.find('#owner').text(p.owner.name);
                    $el.find('.activity').activity(p.active);
                    $el.find('.step-bar.small').stepBar('update', p);
                    $el.attr('data-visible', p.active);
                }).on('redraw', '.activity', function (e, project) {
                    //event is fired to update "active" or "inactive" status of the project
                    $(this).activity(project.active);
                }).on('redraw', '.step-bar.small', function(e, project){
                    //event is fired to update step bar of the project
                    $(this).stepBar('create', project);
                });
            return self;
        };
    }

    ProjectTable.prototype.getProjectById = function (id) {
        return this.projects.filter(function (p) {
            return p.id == id;
        })[0];
    };

    $(document).ready(function () {
        //getting JSON and putting into the Projects array
        $.getJSON('js/challenge.json').then(function (data) {
            data.projects.map(function (p) {
                return Projects.push(new Project(p));
            });
            return Projects
        }).then(function (data) {
            attachClickEvent();
            return new ProjectTable(data);
        }).then(function (dataTable) {
            dataTable.populateTable(addProject)
                .renderTableComponents()
                .attachTableEvents(projectClickHandler);
            dataTable.getProjectById();
        });

        function addProject($el, p) {
            $el.append('<tr data-visible="' + p.active + '"><td id="name"><a id=' + p.id + ' class="link">' + p.name + '</a></td><td id="owner">' + p.owner.name + '</td><td>' + p.endDate + '</td><td id="statusBar"><div class="step-bar small"></div></td><td><span class="activity status">&nbsp;</span></td></tr>');
        }

        function projectClickHandler() {
            var $el = $(this);
            var id = $el.attr('id');
            $('#itemView').show(1, function () {
                populateItemViewWthData($(this), getProjectById(id));
            });
            $('#listView').hide();
        }

        //to bind project data to item view section
        function populateItemViewWthData(view, p) {
            if (p.id === 1) {
                view.find('#prevProject').hide();
                view.find('#nextProject').show().find('span').text(p.id + 1);
            } else if (p.id === Projects.length) {
                view.find('#nextProject').hide();
                view.find('#prevProject').show().find('span').text(p.id - 1);
            } else {
                view.find('#nextProject').show().find('span').text(p.id + 1);
                view.find('#prevProject').show().find('span').text(p.id - 1);
            }
            view.find('#projectDescription').text(p.description);
            view.find('#projectName').text(p.name);
            view.find('#projectPeriod').text(p.getProjectPeriod());
            view.find('#projectOwner').text(p.owner.name);
            view.find('#projectRation').text(p.getRation());
            view.find('#projectProgress').css('width', p.getPercentComplete());
            view.find('#editProjectButton').attr('data-project', p.id);

        }

        function getElementValue(parent, selector) {
            return $(parent).find(selector).val();
        }

        function setElementValue(parent, selector, value) {
            $(parent).find(selector).val(value).end();
        }

        //function to handle visibility of table rows based on the filters
        function applyFilterToProjects(status) {
            $('tbody').find('tr').show();
            switch (status) {
                case "2":
                    $('tbody>tr[data-visible="false"]').toggle();
                    break;
                case "3":
                    $('tbody>tr[data-visible="true"]').toggle();
                    break;
                default :
                    $('tbody>tr').show();
                    break;
            }
        }

        function attachClickEvent() {
            //click event to go from list view into item view
            $('#toListView').on('click', function () {
                var $table = $('#projectTable');
                $('#itemView').hide();
                $('#listView').show();
            });
            //event to navigate to the next or prev. item view
            $('.navigation').on('click', function () {
                var $el = $(this);
                var id = $el.find('span').text();
                populateItemViewWthData($('#itemView'), getProjectById(id));
            });
            $('#myModal').on('show.bs.modal', function (e) {
                //event is fired right after "show" instance method is called
                var $trigger = $(e.relatedTarget);
                var $modal = $(e.currentTarget);
                var title = $trigger.data('title');
                var projectId = $trigger.attr('data-project');
                $modal.find('.modal-title').text(title);
                if (projectId) {
                    var p = getProjectById(projectId);
                    setElementValue($modal, '#projectIdForm', p.id);
                    setElementValue($modal, '#projectNameForm', p.name);
                    setElementValue($modal, '#projectOwnerForm', p.owner.name);
                    setElementValue($modal, '#projectDescriptionForm', p.description);
                    if (p.active) {
                        $modal.find('#projectActiveForm').prop('checked', true);
                    }
                } else {
                    setElementValue($modal, '#projectIdForm', Projects.length + 1);
                }
            }).on('hidden.bs.modal', function (e) {
                //event is fired when the modal has finished being hidden from the user
                var $modal = $(e.currentTarget);
                setElementValue($modal, '#projectIdForm', '');
                setElementValue($modal, '#projectNameForm', '');
                setElementValue($modal, '#projectOwnerForm', '');
                setElementValue($modal, '#projectDescriptionForm', '');
                $modal.find('#projectActiveForm').prop('checked', '');
            }).on('shown.bs.modal', function (e) {
                //event is fired when the modal has been made visible to the user
                var $modal = $(e.currentTarget);
                $modal.find('#projectNameForm').focus();
            });
            $('#form').on('submit', function (e) {
                //on form submit create and anonymous object to store the project
                var p = {
                    id: getElementValue(this, '#projectIdForm'),
                    name: getElementValue(this, '#projectNameForm'),
                    owner: {name: getElementValue(this, '#projectOwnerForm')},
                    description: getElementValue(this, '#projectDescriptionForm'),
                    active: $(this).find('#projectActiveForm').is(":checked")
                };
                var project = getProjectById(p.id);
                var $table = $('#projectTable').find('tbody');
                //if modifying existing project, update the project instance and trigger update the table row data
                if (project) {
                    project.name = p.name;
                    project.description = p.description;
                    project.active = p.active;
                    project.owner.name = p.owner.name;
                    populateItemViewWthData($('#itemView'), project);
                    $table.find('tr').eq(project.id - 1).trigger('tr:update', p.id);
                } else {
                    //if creating a new project, get an instance, add to the table and redraw jquery components
                    p['current_step'] = 10;
                    p['total_steps'] = 18;
                    p['start_date']= moment(new Date()).format('X');
                    p['end_date'] = moment(new Date()).add(5, 'days').format('X')
                    var newProject = new Project(p);
                    Projects.push(newProject);
                    addProject($table, newProject);
                    $table.find('.activity').eq(p.id - 1).trigger('redraw', newProject);
                    $table.find('.step-bar.small').eq(p.id - 1).trigger('redraw', newProject);
                }
                e.preventDefault();
            });
            //event is fired when clicking "Save" button in the modal to create or save the projects
            $('#saveProjectButton').on('click', function () {
                $('#form').trigger('submit');
                $('#myModal').modal('hide');
            });
        }
        //creating table filters to filter table data by "Active" or "Inactive" projects
        $('#project-filter').filters({
            filters: [{
                text: 'View All',
                value: 1
            }, {
                text: 'Active',
                value: 2
            }, {
                text: 'Inactive',
                value: 3
            }],
            onFilter: function (text) {
                applyFilterToProjects(text);
            }
        });
    });

})(jQuery);


//component to create step bar
(function ($) {
    $.fn.stepBar = function (event, p) {
        var isActive = p.active;
        if (event == 'create') {
            var str = '<span class="total">{0}</span><span class="current">{1}</span><div class="progress"> <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: {2}%"></div></div>'.format(p.total_steps, p.current_step, p.getPercentComplete());
            this.append(str);
        }
        if (!isActive) {
            this.find('.total').hide();
            this.find('.current').addClass('active');
            this.find('.progress-bar').hide();
        } else {
            this.find('.total').show();
            this.find('.current').removeClass('active');
            this.find('.progress-bar').show();
        }
        return this;
    }
})(jQuery);
//component to show whether project is active or inactive
(function ($) {
    $.fn.activity = function (state) {
        if (state) {
            this.addClass('active');
        } else if (this.hasClass('active')) {
            this.removeClass('active');
        }
        return this;
    }
})(jQuery);
//component to filter data table
(function ($) {
    $.fn.filters = function (options) {
        var self = this;
        var buttons = options.filters;
        var onFilterFn = options.onFilter;
        buttons.forEach(function (b) {
            var innerHTML = '<lable class="btn btnc btn-custom"><input value="' + b.value + '" type="radio" name="radioFilter"/>' + b.text + '</lable>';
            self.append(innerHTML);
        });
        this.find('lable').eq(0).addClass('active');
        this.find("input[type='radio']").on('change', function () {
            var thisCheck = $(this);
            if (thisCheck.is(':checked')) {
                onFilterFn(thisCheck.val());
            }
        });
        return this;
    }
})(jQuery);