import { useAutomationsPage } from '@/hooks/useAutomationsPage';
import { AutomationsTopbar } from '@/components/automations/AutomationsTopbar';
import { CategorySidebar } from '@/components/automations/CategorySidebar';
import { AutomationsContent } from '@/components/automations/AutomationsContent';

export default function AutomationsPage() {
  const {
    categories,
    selectedCategoryId,
    selectedCategory,
    activeCount,
    pausedCount,
    loading,
    error,
    handleCategorySelect,
    handleToggle,
    handleEdit,
  } = useAutomationsPage();

  return (
    <div className="flex flex-col h-full">
      <AutomationsTopbar />

      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleCategorySelect}
        />

        <AutomationsContent
          loading={loading}
          error={error}
          automations={selectedCategory?.automations ?? []}
          activeCount={activeCount}
          pausedCount={pausedCount}
          onToggle={handleToggle}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
