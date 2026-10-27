import React, { useState } from 'react';
import { useVenueStore } from '../../../store/useVenueStore';
import { CanteenItem } from '../../../types';

export interface CanteenInventoryController {
  items: CanteenItem[];
  filteredItems: CanteenItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  // New item form state
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemCategory: CanteenItem['category'];
  setNewItemCategory: (cat: CanteenItem['category']) => void;
  newItemPriceRupees: string;
  setNewItemPriceRupees: (price: string) => void;
  newItemStock: string;
  setNewItemStock: (stock: string) => void;
  newItemThreshold: string;
  setNewItemThreshold: (threshold: string) => void;
  newItemIcon: string;
  setNewItemIcon: (icon: string) => void;
  handleSaveNewItem: (e: React.FormEvent) => void;
  // Quick stock adjuster
  handleAdjustStock: (id: number, delta: number) => void;
  // Summary counts
  totalItemsCount: number;
  lowStockCount: number;
  totalRetailPaise: number;
}

export const useCanteenInventoryController = (): CanteenInventoryController => {
  const { canteenCatalog, addCanteenCatalogItem, updateCanteenItemStock } = useVenueStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<CanteenItem['category']>('FOOD');
  const [newItemPriceRupees, setNewItemPriceRupees] = useState('50');
  const [newItemStock, setNewItemStock] = useState('20');
  const [newItemThreshold, setNewItemThreshold] = useState('5');
  const [newItemIcon, setNewItemIcon] = useState('🍿');

  const filteredItems = canteenCatalog.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const lowStockCount = canteenCatalog.filter(
    (item) => item.stockCount <= item.lowStockThreshold
  ).length;

  const totalRetailPaise = canteenCatalog.reduce(
    (acc, item) => acc + item.pricePaise * item.stockCount,
    0
  );

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const pricePaise = Math.round((parseFloat(newItemPriceRupees) || 0) * 100);
    const stockCount = parseInt(newItemStock, 10) || 0;
    const lowStockThreshold = parseInt(newItemThreshold, 10) || 5;

    addCanteenCatalogItem({
      name: newItemName.trim(),
      category: newItemCategory,
      pricePaise,
      stockCount,
      lowStockThreshold,
      isEquipment: newItemCategory === 'EQUIPMENT_RENTAL',
      icon: newItemIcon || '🍿',
    });

    // Reset and close
    setNewItemName('');
    setNewItemPriceRupees('50');
    setNewItemStock('20');
    setNewItemThreshold('5');
    setIsAddModalOpen(false);
  };

  const handleAdjustStock = (id: number, delta: number) => {
    updateCanteenItemStock(id, delta);
  };

  return {
    items: canteenCatalog,
    filteredItems,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isAddModalOpen,
    openAddModal: () => setIsAddModalOpen(true),
    closeAddModal: () => setIsAddModalOpen(false),
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    newItemPriceRupees,
    setNewItemPriceRupees,
    newItemStock,
    setNewItemStock,
    newItemThreshold,
    setNewItemThreshold,
    newItemIcon,
    setNewItemIcon,
    handleSaveNewItem,
    handleAdjustStock,
    totalItemsCount: canteenCatalog.length,
    lowStockCount,
    totalRetailPaise,
  };
};
