import React from 'react'
import { useEffect, useState } from 'react';
import { getAllCompany, accecptCompanyService } from '../../../service/userService';
import moment from 'moment';
import { PAGINATION } from '../../../util/constant';
import ReactPaginate from 'react-paginate';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import NoteModal from '../../../components/modal/NoteModal';
import { Modal, Input, Row, Col, Select } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import CommonUtils from '../../../util/CommonUtils';
const { confirm } = Modal
const ManageCompany = () => {
    const [dataCompany, setdataCompany] = useState([])
    const [count, setCount] = useState('')
    const [numberPage, setnumberPage] = useState('')
    const [user, setUser] = useState({})
    const [search, setSearch] = useState('')
    const [censorCode, setCensorCode] = useState('')
    const [propsModal, setPropsModal] = useState({
        isActive: false,
        handleCompany: () => { },
        id: ''
    })
    const censorOptions = [
        {
            value: '',
            label: 'Tất cả'
        },
        {
            value: 'CS1',
            label: 'Đã kiểm duyệt'
        },
        {
            value: 'CS2',
            label: 'Chưa kiểm duyệt'
        },
        {
            value: 'CS3',
            label: 'Đang chờ kiểm duyệt'
        },
    ]
    let handleOnChangeCensor = (value) => {
        setCensorCode(value)
    }
    useEffect(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (userData) {
                let fetchData = async () => {
                    let arrData = []
                    arrData = await getAllCompany({
                        limit: PAGINATION.pagerow,
                        offset: 0,
                        search: CommonUtils.removeSpace(search),
                        censorCode: censorCode


                    })
                    if (arrData && arrData.errCode === 0) {
                        setdataCompany(arrData.data)
                        setnumberPage(0)
                        setCount(Math.ceil(arrData.count / PAGINATION.pagerow))
                    }
                }
                fetchData();
                setUser(userData)
            }

        } catch (error) {
            console.log(error)
        }

    }, [search, censorCode])

    let handleChangePage = async (number) => {
        setnumberPage(number.selected)
        let arrData = await getAllCompany({
            limit: PAGINATION.pagerow,
            offset: number.selected * PAGINATION.pagerow,
            search: CommonUtils.removeSpace(search),
            censorCode: censorCode


        })
        if (arrData && arrData.errCode === 0) {
            setdataCompany(arrData.data)
        }
    }
    let handleAccecptCompany = async (id, note = 'null') => {
        let res = await accecptCompanyService({
            companyId: id,
            note: note,
        })
        if (res && res.errCode === 0) {
            let arrData = await getAllCompany({
                limit: PAGINATION.pagerow,
                offset: numberPage * PAGINATION.pagerow,
                search: CommonUtils.removeSpace(search),
                censorCode: censorCode


            })
            if (arrData && arrData.errCode === 0) {
                setdataCompany(arrData.data)
            }
            toast.success(res.errMessage)
        } else {
            toast.error(res.errMessage)
        }
    }
    const confirmPost = (id) => {
        confirm({
            title: 'Bạn có chắc muốn duyệt công ty này?',
            icon: <ExclamationCircleOutlined />,
            onOk() {
                handleAccecptCompany(id)
            },

            onCancel() {
            },
        });
    }
    const handleSearch = (value) => {
        setSearch(value)
    }
    return (
        <div>
            <div className="col-12 grid-margin">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Danh sách công ty</h4>
                        <Row justify='space-around' className='mt-5 mb-5'>
                            <Col xs={12} xxl={12}>
                                <Input.Search onSearch={handleSearch} placeholder="Nhập tên hoặc mã bài đăng" allowClear enterButton="Tìm kiếm">
                                </Input.Search>
                            </Col>
                            <Col xs={8} xxl={8}>
                                <label className='mr-2'>Loại trạng thái: </label>
                                <Select onChange={(value) => handleOnChangeCensor(value)} style={{ width: '50%' }} size='default' defaultValue={censorOptions[0].value} options={censorOptions}>

                                </Select>
                            </Col>

                        </Row>
                        <div className="table-responsive pt-2">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>
                                            STT
                                        </th>
                                        <th>
                                            Mã công ty
                                        </th>
                                        <th>
                                            Tên công ty
                                        </th>
                                        <th>
                                            Số điện thoại
                                        </th>
                                        <th>
                                            Mã số thuế
                                        </th>
                                        <th>
                                            Trạng thái
                                        </th>
                                        <th>
                                            Ngày khởi tạo
                                        </th>
                                        <th>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataCompany && dataCompany.length > 0 &&
                                        dataCompany.map((item, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{index + 1 + numberPage * PAGINATION.pagerow}</td>
                                                    <td>{item.id}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.phonenumber}</td>
                                                    <td>{item.taxnumber}</td>
                                                    <td><label className={item.censorData.code == 'CS1' ? 'badge badge-success' : (item.censorData.code == 'CS3'? 'badge badge-warning'  : 'badge badge-danger')}>{item.censorData.value}</label></td>
                                                    <td>{moment(item.createdAt).format('DD-MM-YYYY')}</td>
                                                    <td>
                                                        <Link style={{ color: '#4B49AC' }} to={`/admin/edit-company-admin/${item.id}`}>{user?.roleCode === "ADMIN" ? 'Xem chi tiết' : 'Sửa'}</Link>
                                                        &nbsp; &nbsp;
                                                        {item.censorData.code === 'CS3' &&
                                                            <>
                                                                <a style={{ color: '#4B49AC', cursor: 'pointer' }} onClick={() => confirmPost(item.id)} >Duyệt</a>
                                                                &nbsp; &nbsp;
                                                                <a style={{ color: '#4B49AC', cursor: 'pointer' }} onClick={() => setPropsModal({
                                                                    isActive: true,
                                                                    handleCompany: handleAccecptCompany,
                                                                    id: item.id
                                                                })} >Từ chối</a>
                                                                &nbsp; &nbsp;
                                                            </>
                                                        }
                                                        {
                                                            item.censorData.code === 'CS1' &&
                                                            <>
                                                                <a style={{ color: '#4B49AC', cursor: 'pointer' }} onClick={() => setPropsModal({
                                                                    isActive: true,
                                                                    handleCompany: handleAccecptCompany,
                                                                    id: item.id
                                                                })}  >Quay lại trạng thái chờ</a>
                                                                &nbsp; &nbsp;
                                                            </>
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }

                                </tbody>
                            </table>
                            {
                                dataCompany && dataCompany.length == 0 && (
                                    <div style={{ textAlign: 'center' }}>

                                        Không có dữ liệu

                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <ReactPaginate
                        forcePage={numberPage}
                        previousLabel={'Quay lại'}
                        nextLabel={'Tiếp'}
                        breakLabel={'...'}
                        pageCount={count}
                        marginPagesDisplayed={3}
                        containerClassName={"pagination justify-content-center pb-3"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        activeClassName={"active"}
                        onPageChange={handleChangePage}
                    />
                </div>

            </div>
            <NoteModal isOpen={propsModal.isActive} onHide={() => setPropsModal({
                isActive: false,
                handleCompany: () => { },
                id: ''
            })} id={propsModal.id} handleFunc={propsModal.handleCompany} />
        </div >
    )
}

export default ManageCompany
