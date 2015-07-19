chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  var url = tabs[0].url;
  console.log("Found url: " + url);
  console.log("About to set up contextual chat for this page");

  setupContextualChat(url);
});

function setupContextualChat(url) {
  console.log("Setting up contextual chat");
  var myDataRef = new Firebase("https://ryanpbrewster-context-chat.firebaseio.com");

  console.log("Let's see if this user is logged in")
  var usersRef = myDataRef.child("users");
  var authData = myDataRef.getAuth();
  if (authData) {
    console.log("User is already authenticated: " + authData.uid + authData.provider);
    findOrMakeNewChat(myDataRef, url, authData);
  } else {
    console.log("They're not logged in, let's do this")
    authenticateUser(usersRef, function(newAuthData) {
      findOrMakeNewChat(myDataRef, url, newAuthData);
    });
  }
}

function authenticateUser(usersRef, callback) {
  console.log("Trying to log this user in")

  console.log("Calling the FB auth popup");
  usersRef.authWithPassword({
    email    : "ryanpbrewster@gmail.com",
    password : "foobarbaz"
  }, function(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
      usersRef.child(authData.uid).set({});
      callback(authData);
    }
  });

  console.log("Setting up a listener for authentication");
  usersRef.onAuth(function(authData) {
    console.log("Authentication trigger went off")
    if (authData) {
      // save the user"s profile into Firebase so we can list users,
      // use them in Security and Firebase Rules, and show profiles
      console.log("The name we extracted from authData is " + getName(authData));
      usersRef.child(authData.uid).update({
        provider: authData.provider,
        name: getName(authData)
      });
    } else {
      console.log("Somehow the onAuth trigger hit but there's no authData")
    }
  });
}

function getName(authData) {
  switch(authData.provider) {
    case 'password':
      return authData.password.email.replace(/@.*/, '');
     case 'twitter':
       return authData.twitter.displayName;
     case 'facebook':
       return authData.facebook.displayName;
  }
}


function findOrMakeNewChat(myDataRef, url, authData) {
  console.log("Checking if there is an existing chat at this page.");
  Firebase.enableLogging(false);
  console.log("Set up myDataRef: " + myDataRef);

  var threadsRef = myDataRef.child("threads");
  var messagesRef = myDataRef.child("thread_messages");
  var threadUsersRef = myDataRef.child("thread_users");
  var userThreadsRef = myDataRef.child("user_threads");


  threadsRef.orderByChild("url").equalTo(url).limitToFirst(1).once("value", function(snapshot) {
    console.log("[RPB] Checking to see if anything exists");
    if( snapshot.exists() ) {
      console.log("Snapshot exists: " + snapshot.val())
      snapshot.forEach(function(data) {
        console.log("[RPB] Found existing chat: " + data.key() + ": " + data.val());
        console.log("We should set up the existing thread (" + data.val().threadKey);
        setupListeners(messagesRef.child(data.key()));
        return true;
      });
    } else {
      console.log("[RPB] No chats found for this page.");
      var newThread = threadsRef.push({url: url});
      console.log("Made a new thread: " + newThread + " with key " + newThread.key());
      var newThreadMessagesRef = messagesRef.child(newThread.key());
      newThreadMessagesRef.set({});
      console.log("Added the thread to messages: " + newThreadMessagesRef);

      userThreadsRef.child(authData.uid).push({threadKey: newThread.key(), role: "creator"});
      console.log("Added this thread to the list of threads for user");

      threadUsersRef.child(newThread.key()).push({userId: authData.uid, role: "creator"});
      console.log("Added this user to the list of users for thread");

      setupListeners(newThreadMessagesRef);
    }
  });
}

function setupListeners(threadMessagesRef) {
  console.log("Setting up listeners for thread " + threadMessagesRef.key());
  threadMessagesRef.limitToLast(100).on('child_added', function(snapshot) {
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
      threadMessagesRef.push({name: name, text: text});
      $('#messageInput').val('');
    }
  });
}
