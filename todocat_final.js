$(document).ready(function(){
// todo model
	
	var todo = Backbone.Model.extend({
		
		defaults:function(){
     			console.log("todo model created");	 
     			return {description:"No item name",done:false };
     			
     			},
		toggle: function(){
			this.save({done: !this.get('done')});
			console.log(" item toggled...");
		},
		removeThisItem: function(){
			this.destroy();
		}
	});

// todo collection
	var todo_collection = Backbone.Collection.extend({model: todo,
		localStorage: new Backbone.LocalStorage("todo_category_list"),
		initialize: function(){
			console.log("todo collection init...");
			this.listenTo(this,'remove',this.removeThis);
		},

		removeThis: function(model){
			model.trigger('hide');
		},
		/*next_item: function(){
          if (!this.length) 
          {
            return 1;
          }
          return this.length+1;
        },*/
		getDone: function(){
			return this.filter(
				function(model){
					return model.get('done');
				});
		},
		getRemaining: function(){
			return this.filter(
				function(model){
					return !model.get('done');
				});
		}


	});


  // category model
	var Category = Backbone.Model.extend({
		initialize: function(){
           /*
			 // create a new category todo collection
            var collection=new ToDoCollection();
              this.set({
              toDoCollection: collection // pass the variable here
             */
			this.toDoCollection = new todo_collection();
			console.log("category model init...");
		}
	});


// category collection 

var Categories =  Backbone.Collection.extend({
		model: Category,
	});


// todo view
  var TodoView = Backbone.View.extend({
	
		initialize: function(){
			console.log("todo view init..");
			this.listenTo(this.model,'change',this.render);
            this.listenTo(this.model,'hide',this.remove);
		},
		listTemplate : _.template($('#list_template').html()),
		events: {
			"click input": 'toggleStatus',
			"click button":'removeThisModel',
		},

		toggleStatus: function(){
			this.model.toggle();
		},
		render: function(){
			this.$el.html(this.listTemplate(this.model.toJSON()));
			this.model.save();
			return this;
		},
		remove: function(){
			this.$el.remove();
		},
		removeThisModel: function(){
			this.model.removeThisItem();
		}	

	});


	// TODO Collection view

	var Todo_Collection_View = Backbone.View.extend({
		className: "collection",
		initialize: function(group){
			console.log(group+"ToDoCollectionView inited");
			  this.listenTo(this.collection,'add',this.show_all);
			  this.listenTo(this.collection,'reset', this.render);
              this.toDoCollection = group.collection;
		},
		events: {
			"click .clear":"clearDone"
		},
		render: function(){
			this.collection.forEach(this.show_all, this);	
			return this;
		},

		show_all: function(item){
			var toDoView = new TodoView({model: item});
			$(this.el).append(toDoView.render().el);
		},
		clearDone: function(){
			console.log('destroyed...');
			_.invoke(this.toDoCollection.getDone(), 'destroy');
			
		}
	});

//footer view for shows the status of the items in each category
	var FooterView = Backbone.View.extend({
		className: "footer",
		initialize : function (group) {
			this.listenTo(this.collection,'all',this.render)
			this.toDoCollection = group.collection;
		},
		events: {
			"click .clear":"clearDone"
		},
		foot_template : _.template($('#footer_template').html()),
		render: function(){
			this.$el.html(this.foot_template({done: this.toDoCollection.getDone().length, remaining: this.toDoCollection.getRemaining().length}));	
			return this;
		},
		clearDone: function(){
			this.toDoCollectionView = new Todo_Collection_View({collection: this.toDoCollection});
			this.toDoCollectionView.clearDone();
		}
	})



	// category view 
	var CategoryView =  Backbone.View.extend({
		className: "category",
		initialize : function(){
			console.log("category view init..");
		},		
		categoryTemplate : _.template($('#category-template').html()),
		render: function(){
			this.$el.append(this.categoryTemplate(this.model.toJSON()));
			this.toDoCollectionView = new Todo_Collection_View({collection: this.model.toDoCollection, category: this.model.get("name")});
			this.$el.append(this.toDoCollectionView.render().el);
			this.footerView = new FooterView({collection: this.model.toDoCollection});
			this.$el.append(this.footerView.render().el);
			
			return this;
		}

	});



	
	// application view 
	var AppView = Backbone.View.extend({
		
		el: "body",
		events: {
			"keypress #new_item" : "create_item"
		},
		initialize : function(){
			console.log("appView init..");
		},	
		create_item : function(e){
			
			if(e.which == 13){
				var input = $("#new_item").val().split("@");
				if (input.length!=2){
					alert("invalid input !");
					$('#new_item').val('');
					return;
				}	
				var input_category = input[1];
				var input_desc = input[0];
				var catModel = _.find(categories.models, function(model){
					return model.attributes.name == input_category;
				});
				if(!catModel){
					var catModel = new Category({name: input_category});
					var catView = new CategoryView({model: catModel});
					categories.add(catModel);
					$('#lists').append(catView.render().el)
				}
				
				catModel.toDoCollection.add(new todo({description: input_desc, category: input_category, done: false}));
				
				$('#new_item').val('');
			}
		}
	});

	var categories = new Categories();
	var appView = new AppView({collection: categories});

});
