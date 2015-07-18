Firebase.enableLogging(true);
var myDataRef = new Firebase('https://ryanpbrewster-messenger.firebaseio.com/');
var messengesRef = myDataRef.child("messenges");

messengesRef.on('child_added', function(snapshot) {
  var message = snapshot.val();
  displayChatMessage(message.name, message.text);
});

function displayChatMessage(name, text) {
  console.log(name + ": " + text);
  $('<div/>').text(text).prepend($('<em/>').text(name+': ')).prependTo($('#messagesDiv'));
};

document.getElementById("messageInput").addEventListener("keydown", function(e) {
  console.log(e);
  console.log(e.keyCode);
  if (e.keyCode == 13) {
    var name = $('#nameInput').val();
    var text = $('#messageInput').val();
    messengesRef.push({name: name, text: text});
    $('#messageInput').val('');
  }
});
