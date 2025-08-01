'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import style from './style.module.scss'
import { App, Button, Col, Flex, Form, Input, Row, Select, Steps, Tooltip } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import Upload from './components/upload'
import Review from './components/review'
import DownloadIcon from '@/components/icon/document-arrow-down.svg'
import UploadPreferenceModal from './components/upload-preference-modal'
import { downloadURI } from '@/utils/app'

function NewPlayer() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [importId, setImportId] = useState<string | null>(null)
  const [isShowUploadModal, showUploadModal] = useState(false)

  useEffect(() => {
    if (!importId) {
      return
    }
    onNextStep()
  }, [importId])

  const onNextStep = () => {
    setStep((state) => ++state)
  }

  const goBack = () => {
    router.back()
  }

  const onSubmit = async (payload: any) => {
  }

  const onUpload = (file: any) => {
    const configs = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }

    const payload = new FormData()
    payload.append('file', file)

    setLoading(true)
    api
      .post('/api/players/upload-import', payload, configs)
      .then((res) => {
        setImportId(res.data.importId)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const onOpenUpload = () => {
    setStep(0)
    setImportId(null)
  }

  const onImport = () => {
    showUploadModal(true)
  }

  const onCompleteImport = () => {
    onOpenUpload()
  }

  const downloadExcelTemplate = () => {
    downloadURI(`/samples/import_bulk_player.xlsx`, 'import_bulk_player.xlsx')
  }

  return (
    <>
      <div className={style.container}>
        <Form layout="vertical" onFinish={onSubmit} initialValues={{ isRepeat: false }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 28 }}>
            <Flex align='center' gap={16}>
              <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
              <div className={style.title}>Import Bulk Players</div>
            </Flex>
            <Flex align='center' gap={10}>
              <Tooltip title="Download Excel Template" color='#09171e'>
                <Button type='primary' className={style.download} icon={<DownloadIcon />} onClick={downloadExcelTemplate}></Button>
              </Tooltip>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!importId} className={style.submit} onClick={onImport}>Done</Button>
            </Flex>
          </Flex>
          <Flex className={style.stepWrapper}>
            {/* <div className={style.step}>
              <div className={style.tepPoint}>
                <StepIcon />
                <div>Upload</div>
              </div>
            </div>
            <div className={style.step}>
              <div className={style.tepPoint}>
                <StepIcon />
                <div>Review</div>
              </div>
            </div>
            <div className={style.step}>
              <div className={style.tepPoint}>
                <StepIcon />
                <div>Done</div>
              </div>
            </div> */}
            <Steps
              progressDot
              current={step}
              // labelPlacement="vertical"
              style={{
                maxWidth: '90%',
                margin: '0 auto',
                background: 'transparent',
              }}
              items={[
                {
                  title: <span style={{ color: '#fff' }}>Upload</span>,
                  // icon: <StepIcon />,
                },
                {
                  title: <span style={{ color: '#b0b8be' }}>Review</span>,
                  // icon: <StepIcon />,
                },
              ]}
            />
          </Flex>

          {step === 0 && <Upload onUpload={onUpload} />}
          {step === 1 && <Review importId={importId} onImport={onImport} />}
        </Form>
      </div>
      <UploadPreferenceModal importId={importId} isShowModal={isShowUploadModal} showModal={showUploadModal} onRefresh={onCompleteImport} />
    </>
  )
}

export default memo(NewPlayer)