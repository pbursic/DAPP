App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() { // inicijalizacija web3
    return App.initWeb3();
  },

// povezuje client-side aplikaciju sa lokalnim blockchain-om
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // instanca s Meta Mask-om
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    // inicijalizacija ugovora
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Ugovor.json", function(ugovor) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Ugovor = TruffleContract(ugovor);
      // Connect provider to interact with contract
      App.contracts.Ugovor.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Ugovor.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      /*instance.transakcijaEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload kada se izvrsi transakcija
        App.render();
      });*/
    });
  },

// render na stranicu
  render: function() {
    var ugovorInstance;

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        //$("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Ugovor.deployed().then(function(instance) {
      ugovorInstance = instance;
      return ugovorInstance.racuniCount();
    }).then(function(racuniCount) {
      var racuniResults = $("#racuniResults");
      racuniResults.empty();

      var posiljateljSelect = $('#posiljateljSelect');
      posiljateljSelect.empty();

      var primateljSelect = $('#primateljSelect');
      primateljSelect.empty();

      for (var i = 1; i <= racuniCount; i++) {
        ugovorInstance.racuni(i).then(function(racuni) {
          var id = racuni[0];
          var osobaId = racuni[1];
          var osoba = "";

          if(osobaId == 1)
            osoba = "Alice";
          else
            osoba = "Bob";

          /*for (var j = 1; j <= ugovorInstance.osobeCount(); j++){
            if(osobaId == ugovorInstance.osobe(i))
            //app.osobe(1).then(function(o) { osoba = o; })
              osoba = ugovorInstance.osobe(1);
          }*/

          var adresa = racuni[2];
          var nickname = racuni[3];
          var stanjeRacuna = racuni[4];

          var racuniTemplate = "<tr><td style=\"text-align:right\">" + id + "</td><td>"
                                + osoba + "</td><td>"
                                + nickname + "</td><td>"
                                + adresa + "</td><td style=\"text-align:right\">"
                                + stanjeRacuna + "</td></tr>"
          racuniResults.append(racuniTemplate);

          var posiljateljOption = "<option value=\"\" disabled selected style=\"display:none;\">Owner</option><option value='" + id + "' >" + osoba + " " + nickname + "</ option>"
          var primateljOption = "<option value=\"\" disabled selected style=\"display:none;\">Recipient</option><option value='" + id + "' >" + osoba + " " + nickname + "</ option>"

          posiljateljSelect.append(posiljateljOption);
          primateljSelect.append(primateljOption);
        });
      }
    });

    // Load transaction data
    App.contracts.Ugovor.deployed().then(function(instance) {
      ugovorInstance = instance;
      return ugovorInstance.transakcijeCount();
    }).then(function(transakcijeCount) {
      var transakcijeResults = $("#transakcijeResults");
      transakcijeResults.empty();

      for (var i = 1; i <= transakcijeCount; i++) {
        ugovorInstance.transakcije(i).then(function(transakcije) {

          var id = transakcije[0];
          var dateTime = transakcije[1];
          var posiljatelj = transakcije[2];
          var primatelj = transakcije[3];
          var iznos = transakcije[4];

          var transakcijeTemplate = "<tr><td style=\"text-align:right\">" //+ id + "</td><td>"
                                + dateTime + "</td><td>"
                                + posiljatelj + "</td><td>"
                                + primatelj + "</td><td style=\"text-align:right\">"
                                + iznos + "</td></tr>"
          transakcijeResults.append(transakcijeTemplate);
        });
      }
    });
  },

  popuniPolja: function() {
    var ugovorInstance;

    // Load contract data
    App.contracts.Ugovor.deployed().then(function(instance) {
      ugovorInstance = instance;
      return ugovorInstance.racuniCount();
    }).then(function(racuniCount) {
      var posiljatelj = $("#owner");
      posiljatelj.empty();

      var balance = $('#balance');
      balance.empty();

      var primatelj = $('#recipient');
      primatelj.empty();

      var posiljateljSelect = $('#posiljateljSelect').val();
      var primateljSelect = $('#primateljSelect').val();

      for (var i = 1; i <= racuniCount; i++) {
        ugovorInstance.racuni(i).then(function(racuni) {

          if(posiljateljSelect == racuni[0]){
            posiljatelj.val(racuni[2]);
            balance.val(racuni[4]);
          }

          if(primateljSelect == racuni[0])
            primatelj.val(racuni[2]);

        });
      }
    });
  },

  transakcija: function() {
    var posiljateljId = $('#posiljateljSelect').val();
    var primateljId = $('#primateljSelect').val();
    var iznos = $('#amount').val();

    var currentDate = new Date();
    var dateTime = /*currentDate.getDate() + "/"
          + (currentDate.getMonth()+1)  + "/"
          + currentDate.getFullYear() + " "
          +*/ ((currentDate.getHours() < 10) ? "0" + currentDate.getHours() : currentDate.getHours()) + ":"
          + ((currentDate.getMinutes() < 10) ? "0" + currentDate.getMinutes() : currentDate.getMinutes()) + ":"
          + ((currentDate.getSeconds() < 10) ? "0" + currentDate.getSeconds() : currentDate.getSeconds());

    App.contracts.Ugovor.deployed().then(function(instance) {
      return instance.addTransakcija(dateTime, posiljateljId, primateljId, iznos, { from: App.account });
    }).then(function(result) {
      App.clearAll();
    }).catch(function(err) {
      console.error(err);
    });
  },

  clearAll : function() {
    $("#owner").val("");
    $("#balance").val("");
    $("#recipient").val("");
    $("#amount").val("");

    App.render();
  }
};

// load-a se svaki put kada se load-a stranica
$(function() {
  $(window).load(function() {
    App.init();
  });
});
