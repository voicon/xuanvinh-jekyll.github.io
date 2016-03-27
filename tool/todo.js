var todo = todo || {},
		data = {},
		ticketsRef = new Firebase(window.baseFBUrl + 'tickets');

data = data || {};

(function(todo, data, $) {

	var defaults = {
			todoTask: "todo-task",
			todoHeader: "task-header",
			todoDate: "task-date",
			todoDescription: "task-description",
			todoPriority: "task-priority",
			todoAssignee: "task-assignee",
			taskId: "task-",
			formId: "todo-form",
			dataAttribute: "data",
			deleteDiv: "delete-div"
		},
	  codes = {
	  	"1" : "#draft",
	  	"2" : "#todo",
	  	"3" : "#inProgress",
	  	"4" : "#completed",
	  	"5" : "#canceled",
	  	"6" : "#closed"
	  },
	  prios = {
	  	"1": 'Minor',
	  	"10": "Major",
	  	"20": "Blocker",
	  	"30": "Critical"
	  },
	  status = {
	  	"1": 'Unpack',
	  	"10": "Taking picture",
	  	"20": "Machine"
	  },
	  categries = {
	  	"1": 'Table',
	  	"10": "Chair",
	  	"20": "Others"
	  },
	  result = {
	  	"10": 'FAILED',
	  	"1": "PASSED"
	  };

	todo.init = function (options) {

		options = options || {};
		options = $.extend({}, defaults, options);

		refreshGrids();

		$.each(codes, function (index,value){
			$(value).droppable({
				drop: function (event, ui) {
					console.log(element);
					var element = ui.helper,
							css_id = element.attr("id"),
							id = css_id.replace(options.taskId, ""),
							object = data[id],
                            fromCode = object.code
                        ;

					console.log(data[id]);

					removeElement(object);

					object.code = index;

					generateElement(object);

					data[id] = object;
					var ticketsItemRef = ticketsRef.child("tickets").child(id);
        			ticketsItemRef.set(object);
					//localStorage.setItem("todoData", JSON.stringify(data));

					$("#" + defaults.deleteDiv).hide();

                    var user = rootRef.getAuth();
                    log(user.password.email, 'move-ticket', JSON.stringify(
                        {
                            'from': codes[fromCode],
                            'to': codes[index]
                        }));
				}
			});
		});

		$("#" + options.deleteDiv).droppable({
			drop: function(event, ui) {
				console.log(element);
				var element = ui.helper,
						css_id = element.attr("id"),
						id = css_id.replace(options.taskId, ""),
						object = data[id];

				removeElement(object);

				delete data[id];
				ticketsRef.child("tickets").remove(id);
				//localStorage.setItem("todoData", JSON.stringify(data));

				$("#" + defaults.deleteDiv).hide();


			}
		});
	};

	var refreshGrids = function() {
		$("." + defaults.todoTask).remove();
		ticketsRef.child("tickets").on("child_added", function(snap) {
            var params = snap.val();
            data[snap.val().id] = params;
            generateElement(params);
        });
	}



	//Add Task
	var generateElement = function(params) {
		var parent = $(codes[params.code]),
				wrapper,
				wrapperTitle,
				wrapperDescription,
				wrapperDate;

		console.log(parent);

		if (!parent)
			return;

		wrapper = $("<div />", {
			"class" : defaults.todoTask,
			"id" : defaults.taskId + params.id,
			"data" : params.id + ""
		}).appendTo(parent);

		wrapper.draggable({
			start: function() {
				$("#" + defaults.deleteDiv).show();
			},
			stop: function() {
				$("#" + defaults.deleteDiv).hide();
			}
		});


		wrapperTitle = $("<div />", { "class" : defaults.todoHeader, "html" : params.title }).appendTo(wrapper);
        $("<div />", { "class" : "", "html" : '<label>Received At</label>: ' + params.receivedAt }).appendTo(wrapper);
        wrapperDate = $("<div />", { "class" : defaults.todoDate, "html" : '<label>Due date</label>: ' + params.date}).appendTo(wrapper);
        $("<div />", {"class" : defaults.todoAssignee, "html" : '<label>PIC</label>: ' + params.assignee.replace(',', '<br/>')}).appendTo(wrapper);

        var moreInfo = $("<div />", {"class": 'ticket-more'}).appendTo(wrapper);

        wrapperDescription = $("<div />", { "class" : defaults.todoDescription, "html" : '<label>Description</label>: ' + params.description }).appendTo(moreInfo);
		$("<div />", {"class" : defaults.todoPriority + ' ' + defaults.todoPriority + '-' + params.priority,
            "html" : '<label>Priority</label>: ' + prios[params.priority] }).appendTo(moreInfo);
		$("<div />", { "class" : "", "html" : '<label>Status</label>: ' + status[params.status] }).appendTo(moreInfo);
		//$("<div />", { "class" : "", "text" : 0 }).appendTo(wrapper);
		$("<div />", { "class" : "", "html" : '<label>Category</label>: ' + categries[params.category] }).appendTo(moreInfo);
		$("<div />", { "class" : "", "html" : '<label>Coordinator Info</label>: ' + params.coordinatorInformation }).appendTo(moreInfo);
		$("<div />", { "class" : "", "html" : '<label>Result</label>: '+result[params.result] }).appendTo(moreInfo);
		$("<div />", { "class" : "", "html" : '<label>Result Info</label>: ' + params.resultInformation }).appendTo(moreInfo);

		$('<a href="javascript:void(0);" onclick="todo.edit('+params.id+')">Edit</a> | <a class="ticket-more-btn" href="javascript:void(0);" onclick="showHide()">&gt;&gt; show info</a>').appendTo(wrapper);
	};

	// Deleting Tasks
	var removeElement = function(params) {
		$("#" + defaults.taskId + params.id).remove();
	};

	// Form
	todo.add = function() {
        $('#tAssigneeHidden').val($('#tAssignee').val().join(','));
		var errorMessage = "Title can not be empty",
				formData = $("#todo-form").serializeObject(),
				id = formData.data.id;
        var user = rootRef.getAuth();

		if (!formData.data.title) {
			generateDialog(errorMessage);
			return;
		}

        var action = 'edit-ticket';
		if(id <= 0) {
			id = new Date().getTime();
			formData.data.id = id;
			formData.data.code = 1;
            action = 'add-ticket';
		}

		//Saving element in local storage
		var ticketsItemRef = ticketsRef.child("tickets").child(id);
        ticketsItemRef.set(formData.data);
        var params = data[id] !== undefined ? data[id] : {};
        log(user.password.email, action, JSON.stringify(
            {
                'from': params,
                'to': formData.data
            }));

		//Reset Form
		$("#todo-form")[0].reset();
		refreshGrids();
	};

	todo.edit = function(id) {
		var	params = data[id], form = $("#todo-form");
		form[0].reset()
		form.find('#tTitle').val(params.title);
        form.find('#tDescription').val(params.description);
        form.find('#tAssignee').val(params.assignee.split(','));
        form.find('#tPriority').val(params.priority);
        form.find('#date').val(params.date);
        form.find('#tId').val(params.id);
        form.find('#tCode').val(params.code);

        form.find('#receivedAt').val(params.receivedAt);
        form.find('#tStatus').val(params.status);
        form.find('#tCategory').val(params.category);
        form.find('#tCoordinatorInformation').val(params.coordinatorInformation);
        form.find('#tResult').val(params.result);
        form.find('#tResultInformation').val(params.resultInformation);

        return false;
	};

	var generateDialog = function (message) {
		var responseId = "response-dialog",
				title = "Message",
				responseDialog = $("#" + responseId),
				buttonOptions;

		if (!responseDialog.length) {
			responseDialog = $("<div />", {
				title: title,
				id: responseId
			}).appendTo($("body"));
		}

		responseDialog.html(message);

		buttonOptions = {
			"Ok" : function () {
				responseDialog.dialog("close");
			}
		};

		responseDialog.dialog({
			autoOpen: true,
			width: 400,
			modal: true,
			closeOnEscape: true,
			buttons: buttonOptions
		});
	};

	todo.clear = function () {
		data = {};
		//localStorage.setItem("todoData", JSON.stringify(data));
		$("." + defaults.todoTask).remove();
	};

})(todo, data, jQuery);
function showHide() {
    if($(this).prev().prev().css('display') == 'none' ) {
        $(this).prev().prev().show();
        $(this).text('<< hide info');
    } else {
        $(this).prev().prev().hide();
        $(this).text('>> show info');
    }
}


