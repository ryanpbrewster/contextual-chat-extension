chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  var url = tabs[0].url;
  console.log("Found url: " + url);
  console.log("About to set up contextual chat for this page");
  setupContextualChat(url);
});

function setupContextualChat(url) {
  console.log("Setting up contextual chat");
  console.log("First step is to find out if there is an existing chat");
  findOrMakeNewChat(url);
}

function findOrMakeNewChat(url) {
  console.log("Checking if there is an existing chat at this page.");
  Firebase.enableLogging(false);
  var myDataRef = new Firebase('https://ryanpbrewster-messenger.firebaseio.com/');
  console.log("Set up myDataRef: " + myDataRef);

  var chatsRef = myDataRef.child("chats");
  var threadsRef = myDataRef.child("threads");


  chatsRef.orderByChild("url").equalTo(url).limitToFirst(1).once("value", function(snapshot) {
    console.log("[RPB] Checking to see if anything exists");
    if( snapshot.exists() ) {
      snapshot.forEach(function(data) {
        console.log("[RPB] Found existing chat: " + data.key() + ": " + data.val());
        console.log("We should set up the existing thread (" + data.val().thread);
        setupListeners(threadsRef.child(data.val().thread));
      });
    } else {
      console.log("[RPB] No chats found for this page.");
      var newThread = threadsRef.push({});
      console.log("Made a new thread: " + newThread + " with key " + newThread.key());
      chatsRef.push({url: url, thread: newThread.key()})
      console.log("Added the thread to chats");
      setupListeners(newThread);
    }
  });
}

function setupListeners(threadRef) {
  console.log("Setting up listeners for thread " + threadRef.key());
  var messagesRef = threadRef.child("messages");
  messagesRef.on('child_added', function(snapshot) {
    var message = snapshot.val();
    displayChatMessage(message.name, message.text);
  });

  function displayChatMessage(name, text) {
    $('<div/>').text(text).prepend($('<em/>').text(name+': ')).prependTo($('#messagesDiv'));
  };

  document.getElementById("messageInput").addEventListener("keydown", function(e) {
    if (e.keyCode == 13) {
      var name = $('#nameInput').val();
      var text = $('#messageInput').val();
      messagesRef.push({name: name, text: text});
      $('#messageInput').val('');
    }
  });
}
