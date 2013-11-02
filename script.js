var Classifier = angular.module('Classifier', []);

Classifier.controller('ClassifierCtrl', function ($scope) {
  var dataset, data;

  $scope.input = {
    get train () {
      return dataset.train.join('\n');
    },
    set train (lines) {
      dataset.train = lines.split('\n');
      train();
      test();
    },
    get test () {
      return dataset.test.join('\n');
    },
    set test (lines) {
      dataset.test = lines.split('\n');
      train();
      test();
    }
  };

  $scope.load_dataset = load_dataset;
  load_dataset(1);

  function load_dataset (i) {
    $scope.dataset = dataset = {
      name: i,
      train: datasets[i].train.slice(),
      test: datasets[i].test.slice()
    };

    train();
    test();
  }

  function Klass (name) {
    return {name: name, sample_count: 0, word_count: 0, word_freqs: {}};
  }

  function Line (raw) {
    var words = raw.split(/\s+/);
    var class_name = words.splice(0, 1)[0];
    return {raw: raw, class_name: class_name, words: words};
  }

  function train () {
    $scope.data = data = {train: [], test: [], classes: {}, total_samples: 0, total_words: 0};

    for (var i = 0; i < dataset.train.length; i++) {
      var line = data.train[i] = Line(dataset.train[i]);
      var class_name = line.class_name;
      var klass = data.classes[class_name];
      if (!klass) klass = data.classes[class_name] = Klass(class_name);
      klass.sample_count++;
      klass.word_count += line.words.length;
      for (var w = 0; w < line.words.length; w++) {
        var word = line.words[w];
        if (!klass.word_freqs[word]) klass.word_freqs[word] = 0;
        klass.word_freqs[word]++;
      }
    }

    function property_sum (list, property) {
      return _.reduce(list, function (sum, object) {return sum + object[property]}, 0);
    }

    data.total_samples = property_sum(data.classes, 'sample_count');
    data.total_words = property_sum(data.classes, 'word_count');
  };

  function test () {
    var success = [];
    for (var i = 0; i < dataset.test.length; i++) {
      var line = data.test[i] = Line(dataset.test[i]);

      var v = {};
      for (var c in data.classes) {
        if (!data.classes.hasOwnProperty(c)) continue;
        var klass = data.classes[c];
        v[klass.name] = klass.sample_count / data.total_samples;
        for (var w = 0; w < line.words.length; w++) {
          var word = line.words[w];
          if (!klass.word_freqs[word])
            v[klass.name] /= (klass.word_count + klass.sample_count + 1);
          else
            v[klass.name] *= klass.word_freqs[word] / klass.word_count;
        }
      }
      line.classified_as = _.invert(v)[_.max(v)];
      success.push(line.class_name === line.classified_as);
    }
    data.success = _(success).countBy(function (s) { return s ? 'match' : 'mismatch'; });
    data.success.ratio = 100 * data.success.match / dataset.test.length;
  };
});
