// ПРОТОТИП, выбросить. Тикет «Экраны и сценарии гостя и владельца».
//
// Три радикально разных варианта всего набора экранов (Guest и Owner) на
// throwaway-маршруте /prototype/screens, переключаются через ?variant=A|B|C.
// Хранилище общее: бронь, созданная гостем в одном варианте, видна владельцу
// во всех. Пресеты данных на панели показывают пустые и ошибочные состояния.
import PrototypeSwitcher, { useVariant } from '@/components/PrototypeSwitcher'
import { PrototypeStoreProvider, useStore, type Preset } from './store.tsx'
import VariantA from './VariantA.tsx'
import VariantB from './VariantB.tsx'
import VariantC from './VariantC.tsx'

const variants = [
  { key: 'A', name: 'Шаги, как в демо' },
  { key: 'B', name: 'Всё на одном экране' },
  { key: 'C', name: 'Профиль владельца + админка' },
]

function Controls() {
  const s = useStore()
  return (
    <>
      <select
        className="rounded-full bg-white/10 px-2 py-1"
        value={s.preset}
        onChange={(e) => s.setPreset(e.target.value as Preset)}
        title="Набор данных"
      >
        <option className="text-black" value="normal">Данные: обычные</option>
        <option className="text-black" value="empty">Данные: пусто</option>
        <option className="text-black" value="busy">Данные: послезавтра занято</option>
      </select>
      <label className="flex items-center gap-1" title="Следующая попытка брони проиграет гонку: слот займёт другой гость">
        <input type="checkbox" checked={s.simulateConflict} onChange={(e) => s.setSimulateConflict(e.target.checked)} />
        слот перехватят
      </label>
      <span className="text-white/60">броней: {s.bookings.length} · типов: {s.eventTypes.length}</span>
    </>
  )
}

function Inner() {
  const variant = useVariant(variants.map((v) => v.key))
  return (
    <>
      <div className="pb-24">
        {variant === 'A' && <VariantA key="A" />}
        {variant === 'B' && <VariantB key="B" />}
        {variant === 'C' && <VariantC key="C" />}
      </div>
      <PrototypeSwitcher variants={variants} extra={<Controls />} />
    </>
  )
}

function ScreensPrototype() {
  return (
    <PrototypeStoreProvider>
      <Inner />
    </PrototypeStoreProvider>
  )
}

export default ScreensPrototype
