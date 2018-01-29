var app = {

  userModule : {

    username : localStorage.getItem('cryptoClash-name'),

    init: function(){

      if( !this.username ){ // if no username is saved
        $('#welcome-modal').modal('show'); // open the modal
        $('#welcome-modal').off('click'); // remove the background click event
        $('.modal-accept').on('click' , function(){

          var input = $('#nickname-input').val().trim();

          if( input != '' ){ // check if nickname is not empty
            app.userModule.username = input;
            localStorage.setItem('cryptoClash-name' , input); // saving username
            $('#welcome-modal').modal('hide');
          }

        });
      }

    }
  },

  priceHistoryModule : {

    init: function () {
      console.log("Price History Loaded");
    }
  },

  pollModule : {

    init: function () {
      console.log("Poll Module loaded");
    }
  },

  newsModule : {

    apiKey: apiKey,
    baseURL: "https://newsapi.org/v2/everything?q=", 

    topics: [
    "bitcoin",
    "ethereum",
    "ripple",
    "dogecoin"
    ],

    // stores articles pulled from ajax call as properties under the topic name
    articles: {},

    init: function () {

      console.log("News module loaded");

      app.newsModule.topics.forEach(function(item) {

        app.newsModule.artGet(item);

      });

      console.log(app.newsModule.articles, "all topic results");

      // listens for topic link selection, then renders appropriate articles
      $(".topic_tab").on("click", function() {

        topic = $(this).text().toLowerCase();
        app.newsModule.artDisplay(topic);

      });

    },

    artGet: function(topic) {

      const queryURL = app.newsModule.baseURL + topic + "$from=2018-01-18&to=2018-01-25&sortBy=popularity&pageSize=10&apiKey=" + app.newsModule.apiKey;
      console.log(queryURL, "Query URL");

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

        const x = result.articles;

        Object.defineProperty(app.newsModule.articles, topic, {
          value: x
        });



      }).fail(function(err) {
        throw err;
      });

    },

    artDisplay: function(x) {

      console.log(x, "selected");
      const arrX = app.newsModule.articles[x];
      console.log(arrX, "articles grabbed");

      $("#articles").empty();

      arrX.forEach(function(article) {

        let div = $("<div>").addClass("container article"),
            h4 = $("<h4>").text(article.title),
            img = $("<img>").addClass("img_article").attr("src", article.urlToImage),
            pAuth = $("<p>").text(article.author),
            pBod = $("<p>").html('<em>' + article.description + '</em>'),
            a = $("<a>").addClass("art_link").attr("href", article.url).text("Link to article");

        div.append(h4).append(img).append(pAuth).append(pBod).append(a);

        $("#articles").append(div);

      }); 

    }

  },

  chatModule : {

    socket : io(),

    parseMessage : function( msg ){
      return '<strong>'+ msg.name +':</strong> ' + msg.message
    },

    init: function () {
      $('form').submit(function () { // hook the chat form submit
        var newMessage = $('#m').val();

        if (newMessage != '') {
          newMessage = 
          { 
            'name' : app.userModule.username, 
            'message' : newMessage
          }
          app.chatModule.socket.emit('chat message', newMessage); 
          $('#m').val('');
        }

        return false;
      });

      //get all messages and populate message history
      $.get( "http://localhost:8080/api/messages/", function( response ) {
        return response }).done(function( data ){
          for( var i = 0; i < data.length; i++ ){
            $('#messages').append($('<li>').html( app.chatModule.parseMessage( data[i] ) ));
          }
          $('#message-display').scrollTop(9999999);
        })

        app.chatModule.socket.on('chat message', function (msg) {
          $('#messages').append($('<li>').html( app.chatModule.parseMessage( msg ) ));
          $('#message-display').scrollTop(9999999);
        });

      }

    },

    startup : function(){

      this.userModule.init();
      this.priceHistoryModule.init();
      this.pollModule.init();
      this.newsModule.init();
      this.chatModule.init();

    }

  }

app.startup(); // main entry point of this application