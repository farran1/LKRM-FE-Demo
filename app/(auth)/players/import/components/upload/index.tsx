import { memo } from 'react'
import style from './style.module.scss'
import { Upload } from 'antd'
import UploadIcon from '@/components/icon/cloud-upload.svg'

const UploadPage = ({
  onUpload
}: any) => {
  const uploadProps = {
    name: 'file',
    multiple: false,
    action: '',
    accept: '.csv,.xls,.xlsx',
    onChange(info: any) {
      // const { status } = info.file
      // if (status !== 'uploading') {
      //   // info.file, info.fileList
      //   const file = info.file
      //   onUpload(file)
      // }
      // if (status === 'done') {
      //   message.success(`${info.file.name} file uploaded successfully.`)
      // } else if (status === 'error') {
      //   message.error(`${info.file.name} file upload failed.`)
      // }
    },
    onDrop(e: any) {
      // Dropped files: e.dataTransfer.files
      // const files = e.dataTransfer.files
      // if (files.length === 0) return
      // const file = files[0]
      // onUpload(file)
    },
    // @ts-ignore
    customRequest({ file, action, method, onError, onProgress, onSuccess }) {
      onUpload(file)
    }
  }

  return (
    <div className={style.container}>
      <div className={style.title}>Upload your file</div>
      {/* @ts-ignore */}
      <Upload.Dragger className={style.dragger} {...uploadProps}>
        <div className={style.upload}>
          <UploadIcon />
          <div>Click to upload or drag and drop<br />.csv, .xlsx (Max 10 MB)</div>
        </div>
      </Upload.Dragger>
    </div>
  )
}

export default memo(UploadPage)