{/* Subtasks Builder */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Чек-лист подзадач ({(form.subtasks || []).length})
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoClose !== false}
                  onChange={(e) => setForm({ ...form, autoClose: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span>Авто-закрытие задачи при 100%</span>
              </label>
            </div>

            {(form.subtasks || []).length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-40 overflow-y-auto pr-1">
                {(form.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSub(st.id)}
                      className="flex items-center gap-2 text-left flex-1 hover:opacity-80 transition"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                        {st.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSub(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Добавить пошаговое действие..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                + Шаг
              </button>
            </form>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          {!isCreating && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENT: MASTER DAILY TEMPLATE MODAL
// ==========================================
function TemplateModal({ items, onClose, onSave }) {
  const [templateItems, setTemplateItems] = useState([...items]);
  const [newText, setNewText] = useState('');
  const [newSection, setNewSection] = useState('morning');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem = {
      id: `tpl_${Date.now()}`,
      section: newSection,
      text: newText.trim()
    };
    setTemplateItems([...templateItems, newItem]);
    setNewText('');
  };

  const handleRemoveItem = (id) => {
    setTemplateItems(templateItems.filter((i) => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            Настройка базового шаблона дня
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Изменения зафиксируются в вашем ежедневном расписании. Каждый новый день будет автоматически создаваться с этими регулярными пунктами.
        </p>

        {/* List grouped by section */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {SECTIONS_META.map((sec) => {
            const secList = templateItems.filter((i) => i.section === sec.id);
            return (
              <div key={sec.id} className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sec.title}</h4>
                {secList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span>{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Add Template Item Form */}
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
          <select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            <option value="morning">🌅 Утро</option>
            <option value="day">🧹 Быт</option>
            <option value="evening">🌙 Вечер</option>
          </select>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Название нового регулярного дела..."
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
          >
            +
          </button>
        </form>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(templateItems)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
          >
            Сохранить шаблон
          </button>
        </div>
      </div>
    </div>
  );
}
