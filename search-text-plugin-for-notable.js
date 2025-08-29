// ----- Search plugin (تصحيح) -----
// افترض أن مكتبة mark.js محمّلة قبل هذا السكربت
(function(){
  // 1) إنشاء الـ UI (تأكد mainbar موجود)
  var mainbar = document.querySelector('.mainbar.layout.column');
  if (!mainbar) {
    console.error('Search plugin: .mainbar.layout.column not found. Plugin aborted.');
    return;
  }

  // أضف ستايل مرة واحدة
  if (!document.querySelector('#search-plugin-style')) {
    document.head.insertAdjacentHTML('afterBegin',
      '<style id="search-plugin-style">.selected{background-color:rgba(255,35,0,0.57)!important;}</style>'
    );
  }

  // إذا الواجهة موجودة لا نعيد إدراجها
  if (!document.querySelector('.search-text-js')) {
    mainbar.insertAdjacentHTML('afterBegin', `
      <div class="layout-header toolbar search-text-js">
        <div class="multiple grow">
          <div class="multiple joined no-separators grow search">
            <input type="search" name="searchText" class="bordered grow small" placeholder="Search text..." value="">
            <button data-search="clear" class="label bordered compact xsmall" title="Clear" hidden><i class="icon">close_circle</i></button>
            <button data-search="search" class="label bordered compact xsmall" title="Search"><i class="icon">magnify</i></button>
          </div>
          <div class="button disabled bordered xsmall search-count-js" hidden></div>
        </div>
      </div>
    `);
  }

  // متغيرات الحالة
  var markInstance = null;
  var currentSelectedMarkIndex = 0;
  var selectedMarkCount = 0;

  // تهيئة/إعادة تهيئة markInstance بشكل آمن
  function initMarkInstance() {
    var previewEl = document.querySelector('.layout-content.preview');
    if (!previewEl) {
      markInstance = null;
      return;
    }
    try {
      markInstance = new Mark(previewEl);
    } catch (err) {
      console.error('mark.js initialization failed:', err);
      markInstance = null;
    }
  }

  // تحديث عداد النتائج
  function updateSearchCountLabel() {
    var searchCountLabel = document.querySelector('.search-count-js');
    if (!searchCountLabel) return;
    if (selectedMarkCount > 0) {
      searchCountLabel.hidden = false;
      searchCountLabel.innerText =  currentSelectedMarkIndex + '/' + selectedMarkCount;
    } else {
      searchCountLabel.hidden = true;
      searchCountLabel.innerText = '';
    }
  }

  // الدالة التي تُجرى البحث (تنتظر انتهاء mark ثم تحدث العدّاد)
  window.search = function (searchPhrase) {
    if (!markInstance) return;
    var phrase = (searchPhrase || '').toString();

    // إذا البحث فراغ -> فقط ازل الـ marks
    if (!phrase.trim()) {
      markInstance.unmark({
        done: function() {
          selectedMarkCount = 0;
          currentSelectedMarkIndex = 0;
          updateSearchCountLabel();
        }
      });
      var clearBtn = document.querySelector('button[data-search="clear"]');
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    var options = {
      separateWordSearch: false,
      diacritics: true,
      debug: false,
      // done ستستلم عدد العناصر المميزة (mark.js ينادي done(r))
      done: function(count) {
        // احصل على العدد الفعلي (محمية)
        selectedMarkCount = document.querySelectorAll('.layout-content.preview mark').length || count || 0;
        currentSelectedMarkIndex = 0;
        updateSearchCountLabel();
        // اذهب للنتيجة الأولى
        if (selectedMarkCount > 0) searchNext();
      }
    };

    // أولًا ازل العلامات القديمة ثم ضع العلامات الجديدة
    markInstance.unmark({
      done: function() {
        try {
          markInstance.mark(phrase, options);
        } catch (err) {
          console.error('mark() failed:', err);
        }
      }
    });

    var clearBtn = document.querySelector('button[data-search="clear"]');
    if (clearBtn) clearBtn.hidden = false;
  };

  // استماع على التايب داخل الحقل
  var inputEl = document.querySelector('input[name="searchText"]');
  if (inputEl) {
    inputEl.removeAttribute('onkeypress'); // ازل أي onkeypress قديم
    inputEl.addEventListener('input', function(event) {
      window.search(event.target.value);
    });
  }

  // التنقل بين النتائج
  window.searchNext = function () {
    var markElements = document.querySelectorAll('.layout-content.preview mark');
    if (!markElements || markElements.length === 0) {
      currentSelectedMarkIndex = 0;
      updateSearchCountLabel();
      return;
    }
    if (currentSelectedMarkIndex >= markElements.length) {
      currentSelectedMarkIndex = 0;
    }
    markElements.forEach(function(element, index) {
      if (currentSelectedMarkIndex === index) {
        element.classList.add('selected');
        // آمِن لتصفح العناصر
        if (typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        element.classList.remove('selected');
      }
    });
    currentSelectedMarkIndex++;
    updateSearchCountLabel();
  };

  // أزرار البحث و المسح
  var searchBtn = document.querySelector('button[data-search="search"]');
  if (searchBtn) searchBtn.addEventListener('click', searchNext);

  window.resetSearch = function () {
    var inp = document.querySelector('input[name="searchText"]');
    if (inp) inp.value = '';
    if (markInstance) {
      markInstance.unmark({
        done: function() {
          currentSelectedMarkIndex = 0;
          selectedMarkCount = 0;
          updateSearchCountLabel();
        }
      });
    }
    var clearBtn = document.querySelector('button[data-search="clear"]');
    if (clearBtn) clearBtn.hidden = true;
  };

  var clearBtn = document.querySelector('button[data-search="clear"]');
  if (clearBtn) clearBtn.addEventListener('click', resetSearch);

  // اختصار Ctrl+Shift+F لانتقاء حقل البحث
  document.addEventListener('keyup', function(event) {
    if (event.ctrlKey && event.shiftKey && (event.key === 'F' || event.key === 'f')) {
      var inp = document.querySelector('input[name="searchText"]');
      if (inp) inp.select();
    }
  });

  // مراقب DOM مبسط: فقط يتحقق إن كانت منطقة preview موجودة أو لا
  var mutationObserver = new MutationObserver(function() {
    var previewExists = !!document.querySelector('.layout-content.preview');
    var searchUI = document.querySelector('.search-text-js');

    if (previewExists) {
      initMarkInstance();
      resetSearch();
      if (searchUI) searchUI.hidden = false;
    } else {
      // لو اختفى الـ preview اخفي واجهة البحث
      if (searchUI) searchUI.hidden = true;
    }
  });

  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // تهيئة مبدئية
  initMarkInstance();
})();
