(function () {
  // انتظر حتى يظهر المحرر
  function waitForEditor() {
    const wrapper = document.querySelector(".monaco-editor-wrapper.layout-content.editor");
    if (!wrapper) {
      setTimeout(waitForEditor, 500);
      return;
    }

    // الحصول على instance من monaco editor
    const editor = monaco?.editor?.getModels ? monaco.editor.getEditors()[0] : null;
    if (!editor) {
      console.warn("لم يتم العثور على الـ monaco editor");
      return;
    }

    // إنشاء شريط البحث
    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "ابحث هنا...";
    searchBar.style.position = "absolute";
    searchBar.style.top = "5px";
    searchBar.style.right = "10px";
    searchBar.style.zIndex = "1000";
    searchBar.style.width = "200px";
    searchBar.style.padding = "5px 10px";
    searchBar.style.borderRadius = "6px";
    searchBar.style.border = "1px solid #ccc";
    searchBar.style.fontSize = "14px";
    searchBar.style.background = "#fff";

    wrapper.appendChild(searchBar);

    // البحث أثناء الكتابة
    searchBar.addEventListener("input", () => {
      const value = searchBar.value;
      if (!value) {
        editor.getAction("actions.find").run().then(() => {
          editor.trigger('', 'closeFindWidget');
        });
        return;
      }
      editor.getAction("actions.find").run().then(() => {
        editor.trigger("keyboard", "type", { text: value });
      });
    });
  }

  waitForEditor();
})();
