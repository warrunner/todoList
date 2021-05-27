//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-varun:<PASSWORD>@cluster0.ao4g3.mongodb.net/todoListDB", {useNewUrlParser:true, useUnifiedTopology:true} );

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1  = new Item({
  name: "Buy snacks"
});

const item2 = new Item({
  name: "hello"
});

const defaultItems = [item1, item2];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully updated the default Items");
        }
      });
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  })
  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })
  
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === 'Today') {
    Item.deleteOne({_id:checkedItemId}, function(err){
      if(!err) {
        console.log("succesfully deleted the item");
        res.redirect("/");
      }
    }, {useFindAndModify:false});
  } else {
    List.findOneAndUpdate({name:listName},{$pull:{items: {_id:checkedItemId}}}, function(err){
      if(!err) {
        console.log("succesfully deleted the item from " + listName);
        res.redirect("/"+listName);
      }
    })
  }
  
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList ){
    if(!err) {
      if(!foundList){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        console.log("Doesn't Exists");
        res.redirect("/" + customListName);
      }
      else {
        //show an existing list

        res.render("list", {listTitle: foundList.name, newListItems:foundList.items})
      }
    }
  })
  const list = new List({
    name: customListName,
    items: defaultItems
  });

  list.save();

})




app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null|| port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
