/**
 * Created by alexey.kozyachiy on 8/28/15.
 */
(function ($) {
    var Projects = [];

    function Project(p) {
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
                return moment.unix(this.start_date).format('ll');
            }
        });
        Object.defineProperty(this, 'endDate', {
            get: function () {
                return moment.unix(this.end_date).format('ll');
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


    $(document).ready(function () {

        function loadData() {
            $.getJSON('js/challenge.json').then(function (data) {
                data.projects.map(function (p) {
                    this.push(new Project(p));
                }, Projects);
            });
        }

        function getProjectById(id) {
            return Projects.filter(function (p) {
                return p.id == id;
            })[0];
        }

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

        }

        function getElementValue(parent, selector) {
            return $(parent).find(selector).val();
        }

        function attachClickEvent() {
            $("#name>a").on('click', function () {
                var $el = $(this);
                var id = $el.attr('id');
                $('#itemView').show(1, function () {
                    populateItemViewWthData($(this), getProjectById(id));
                });
                $('#listView').hide();
            });
            $('#toListView').on('click', function () {
                $('#itemView').hide();
                $('#listView').show();
            });
            $('.navigation').on('click', function () {
                var $el = $(this);
                var id = $el.find('span').text();
                populateItemViewWthData($('#itemView'), getProjectById(id));
            });
            $('#newProjectButton').on('click', function () {
                var $modal = $('#myModal');
                $modal.find('.modal-title').text('Add New Project');
                $modal.modal();
            });
            $('#myModal').on('shown.bs.modal', function () {
                console.log('Modal Here');
            }).on('show.bs.modal', function () {
                var form = $(this).find('#form');
                console.log(form);
            });
            $('#form').on('submit', function (e) {
                var projectName = getElementValue(this, '#projectNameForm');
                var projectOwner = getElementValue(this, '#projectOwnerForm');
                var startDateForm = getElementValue(this, '#startDateForm');
                var endDateForm = getElementValue(this, '#endDateForm');
                var projectDescriptionForm = getElementValue(this, '#projectDescriptionForm');
                var projectActiveForm = $(this).find('#projectActiveForm').is(":checked");

                    console.log(projectName, projectOwner, projectDescriptionForm, projectActiveForm);
                e.preventDefault();
            });

            $('#saveProjectButton').on('click', function () {
                $('#form').trigger('submit');
                $('#myModal').modal('hide');
            });
        }

        function populateTable($el, data) {
            data.forEach(function (p) {
                $el.append('<tr><td id="name"><a id=' + p.id + ' class="link">' + p.name + '</a></td><td>' + p.owner.name + '</td><td>' + p.endDate + '</td><td id="statusBar">StepBar Here</td><td id="active">' + p.active + '</td></tr>');
            });
            attachClickEvent();
        }

        loadData();
        setTimeout(function () {
            populateTable($('.table>tbody'), Projects);
        }, 500);
    });

})(jQuery);
