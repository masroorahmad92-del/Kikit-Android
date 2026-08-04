import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {FadeModal} from './base/FadeModal';
import {Text} from './base/Text';
import {colors, moderateScale, fonts} from '../theme';
import {preferencesService} from '../api/services/preferencesService';

const getItemId = item => item?.id || item?.uuid || item?.slug || item?.name;

const EditPreferencesModal = ({
  visible,
  onClose,
  title,
  mode = 'interests', // 'interests' | 'hobbies'
  selectedItems = [],
  onSave,
  minimumSelection = 0,
  isSaving = false,
}) => {
  const modalRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');

  const listKey = mode === 'hobbies' ? 'hobbies' : 'interests';
  const queryKey = ['profile-edit-preferences', mode];

  const fetcher =
    mode === 'hobbies' ? preferencesService.getHobbies : preferencesService.getInterests;

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetcher();
      return response.data || [];
    },
    enabled: visible,
    staleTime: 1000 * 60 * 60,
  });

  const flatItems = useMemo(() => {
    if (!Array.isArray(categories)) {
      return [];
    }

    return categories.flatMap(category => {
      const items = category?.[listKey] || [];
      return items.map(item => ({
        ...item,
        id: getItemId(item),
        category_id: item?.category_id ?? category?.id,
        category_name: item?.category_name ?? category?.name,
      }));
    });
  }, [categories, listKey]);

  const selectedCountLabel =
    minimumSelection > 0 ? `${selectedIds.length}/${minimumSelection}` : `${selectedIds.length}`;

  useEffect(() => {
    if (visible) {
      const ids = (selectedItems || [])
        .map(item => getItemId(item))
        .filter(Boolean);
      setSelectedIds(ids);
      setError('');
      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, selectedItems]);

  const toggleSelection = id => {
    if (isSaving) {
      return;
    }
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      }
      return [...prev, id];
    });
  };

  const handleSave = () => {
    if (minimumSelection && selectedIds.length < minimumSelection) {
      setError(`Select at least ${minimumSelection} ${mode}`);
      return;
    }

    if (!onSave) {
      return;
    }

    const selectedObjects = flatItems.filter(item => selectedIds.includes(item.id));
    onSave(selectedObjects);
  };

  const isSaveDisabled =
    isSaving || (minimumSelection > 0 && selectedIds.length < minimumSelection);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text fs="M" color="grey600" style={styles.stateText}>
            Loading {mode}...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <Text fs="M" color="grey800" style={styles.stateText}>
            Failed to load {mode}. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.7}>
            <Text ff="c-Regular" color="white">
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!categories?.length) {
      return (
        <View style={styles.stateContainer}>
          <Text fs="M" color="grey600">
            No {mode} found.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map(category => (
          <View key={category?.id || category?.name} style={styles.categorySection}>
            <Text ff="c-Regular" fs="M" color="grey800" style={styles.categoryTitle}>
              {category?.name || 'Untitled'}
            </Text>
            <View style={styles.tagsWrapper}>
              {(category?.[listKey] || []).map(item => {
                const id = getItemId(item);
                const isSelected = selectedIds.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.tag,
                      isSelected && styles.tagSelected,
                    ]}
                    onPress={() => toggleSelection(id)}
                    activeOpacity={0.7}>
                    <Text
                      ff="c-Regular"
                      fs="S"
                      color={isSelected ? 'white' : 'grey700'}
                      style={styles.tagText}>
                      {item?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={onClose}
      header={true}
      headerTitle={title}
      setIsVisible={onClose}
      height={moderateScale(600)}
      isButtonAdded={true}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}
      dualButton2Disabled={isSaveDisabled}
      loading={isSaving}>
      <View style={styles.modalBody}>
        <View style={styles.helperRow}>
          <Text ff="c-Regular" fs="S" color="grey500">
            Tap to add or remove {mode}
          </Text>
          <Text ff="c-Regular" fs="S" color="grey700">
            {selectedCountLabel}
          </Text>
        </View>
        {error ? (
          <Text fs="XS" color="danger" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
        {renderContent()}
      </View>
    </FadeModal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    flex: 1,
    paddingBottom: moderateScale(16),
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  categorySection: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(20),
  },
  categoryTitle: {
    fontFamily: fonts.CabinetMedium,
    marginBottom: moderateScale(8),
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -moderateScale(4),
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScale(8),
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    textTransform: 'capitalize',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(24),
  },
  stateText: {
    textAlign: 'center',
    marginTop: moderateScale(12),
  },
  retryButton: {
    marginTop: moderateScale(16),
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  errorText: {
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(4),
  },
});

export default EditPreferencesModal;

