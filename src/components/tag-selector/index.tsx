import React, { memo, useCallback } from 'react';
import { Tag, Form } from 'antd';
import style from './style.module.scss'

const { CheckableTag } = Tag;

const TagSelector = ({ options, value, onChange }: { options: Array<any>, value?: string; onChange?: (val: string) => void }) => {
  // Note: Avoid inline function in .map()
  // const handlers = useMemo(() => {
  //   const result: Record<string, () => void> = {};
  //   tagsData.forEach(tag => {
  //     result[tag] = () => onChange?.(tag);
  //   });
  //   return result;
  // }, [onChange]);

  // return (
  //   <div>
  //     {tagsData.map(tag => (
  //       <CheckableTag
  //         key={tag}
  //         checked={value === tag}
  //         onChange={handlers[tag]}
  //       >
  //         {tag}
  //       </CheckableTag>
  //     ))}
  //   </div>

  const handleChangeTag = useCallback((tag: string) => {
    if (onChange) {
      onChange(tag);
    }
  }, [onChange])

  return (
    <div>
      {options.map(option => (
        <CheckableTag
          className={style.tag}
          key={option.value}
          checked={value === option.value}
          onChange={() => handleChangeTag(option.value)}
        >
          {option.label}
        </CheckableTag>
      ))}
    </div>
  );
};

export default memo(TagSelector)