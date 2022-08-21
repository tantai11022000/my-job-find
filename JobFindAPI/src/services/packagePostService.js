import db from "../models/index";
const { Op, and } = require("sequelize");
import paypal from 'paypal-rest-sdk'
require('dotenv').config();
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'ARulk2xnPxfzBhbH4DrZsANY3Pm80t4Prbw4AfaEI1kgtCH3Nzz__h2Fa8FFph8DsD9ZPZpN8d6tdahJ',
    'client_secret': 'EAcDSFu6gZjU52EhjvIGUYQz0d2XlEGk4PiJfTj8y23uTrZtesIPElfNKY9AcndkmtdSDCZQP7TaqcEn'
});

let getAllPackage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.limit || !data.offset) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters !'
                })
            } else {
                let objectFilter = {
                    offset: +data.offset,
                    limit: +data.limit
                }
                if (data.search) {
                    objectFilter.where = {name: {[Op.like]: `%${data.search}%`}}
                }
                let packagePosts = await db.PackagePost.findAndCountAll(objectFilter)
                resolve({
                    errCode: 0,
                    data: packagePosts.rows,
                    count: packagePosts.count
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getPackageByType = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.isHot === '') {
                resolve({
                    errCode: 1,
                    errMessage: `Missing required parameters !`
                })
            } else {
                let packagePost = await db.PackagePost.findAll({
                    where: { isHot: data.isHot }
                })
                resolve({
                    errCode: 0,
                    data: packagePost
                })
            }

        } catch (error) {
            reject(error)
        }
    })
}

let getPackageById = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing required parameters !`
                })
            } else {
                let packagePost = await db.PackagePost.findOne({
                    where: { id: data.id }
                })
                if (packagePost) {
                    resolve({
                        errCode: 0,
                        data: packagePost
                    })
                }
                else {
                    resolve({
                        errCode: 0,
                        errMessage: 'Không tìm thấy dữ liệu gói sản phẩm'
                    })
                }
            }

        } catch (error) {
            reject(error)
        }
    })
}

let getPaymentLink = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.amount) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing required parameters !`

                })
            }
            else {
                let infoItem = await db.PackagePost.findOne({
                    where: { id: data.id }
                })
                let item = [{
                    "name": `${infoItem.name}`,
                    "sku": infoItem.id,
                    "price": infoItem.price,
                    "currency": "USD",
                    "quantity": data.amount
                }]

                let create_payment_json = {
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": `${process.env.URL_REACT}/admin/payment/success`,
                        "cancel_url": `${process.env.URL_REACT}/admin/payment/cancel`
                    },
                    "transactions": [{
                        "item_list": {
                            "items": item
                        },
                        "amount": {
                            "currency": "USD",
                            "total": +data.amount * infoItem.price
                        },
                        "description": "This is the payment description."
                    }]
                };

                paypal.payment.create(create_payment_json, function (error, payment) {
                    if (error) {
                        resolve({
                            errCode: -1,
                            errMessage: error,
                        })

                    } else {
                        resolve({
                            errCode: 0,
                            link: payment.links[1].href
                        })

                    }
                });
            }
        } catch (error) {
            reject(error)
        }
    })
}

let paymentOrderSuccess = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.PayerID || !data.paymentId || !data.token) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter !'
                })
            } else {
                let infoItem = await db.PackagePost.findOne({
                    where: { id: data.packageId }
                })
                let execute_payment_json = {
                    "payer_id": data.PayerID,
                    "transactions": [{
                        "amount": {
                            "currency": "USD",
                            "total": +data.amount * infoItem.price
                        }
                    }]
                };

                let paymentId = data.paymentId;

                paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
                    if (error) {
                        resolve({
                            errCode: 0,
                            errMessage: error
                        })
                    } else {
                        let orderPackage = await db.OrderPackage.create({
                            packagePostId: data.packageId,
                            userId: data.userId,
                            currentPrice: infoItem.price,
                            amount: +data.amount
                        })
                        if (orderPackage) {
                            let user = await db.User.findOne({
                                where: { id: data.userId },
                                attributes: {
                                    exclude: ['userId']
                                }
                            })
                            let company = await db.Company.findOne({
                                where: { id: user.companyId },
                                raw: false
                            })
                            if (company) {
                                if (infoItem.isHot == 0) {
                                    company.allowPost += +infoItem.value
                                }
                                else {
                                    company.allowHotPost += +infoItem.value
                                }
                                await company.save()

                            }
                        }
                        resolve({
                            errCode: 0,
                            errMessage: 'Hệ thống đã ghi nhận lịch sử mua của bạn'
                        })
                    }
                });
            }
        } catch (error) {
            reject(error)
        }
    })
}

let setActiveTypePackage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!data.id || data.isActive === '') {
                resolve({
                    errCode: 1,
                    errMessage: `Missing required parameters !`
                })
            } else {
                let packagePost = await db.PackagePost.findOne({
                    where: { id: data.id },
                    raw: false
                })
                if (!packagePost) {
                    resolve({
                        errCode: 2,
                        errMessage: `Gói sản phẩm không tồn tại`
                    })
                }
                else {
                    packagePost.isActive = data.isActive
                    await packagePost.save()
                    resolve({
                        errCode: 0,
                        errMessage: data.isActive == 0 ? `Gói sản phẩm đã ngừng kích hoạt` : `Gói sản phẩm đã hoạt động`
                    })

                }
            }

        } catch (error) {
            reject(error)
        }
    })
}

let creatNewPackagePost = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.name || !data.price || !data.value || data.isHot === '') {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters !'
                })
            } else {
                let packagePost = await db.PackagePost.create({
                    name: data.name,
                    value: data.value,
                    isHot: data.isHot,
                    price: data.price,
                    isActive: 1
                })
                if (packagePost) {
                    resolve({
                        errCode: 0,
                        errMessage: 'Tạo gói sản phẩm thành công'
                    })
                }
                else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Tạo gói sản phẩm thất bại'
                    })
                }
            }
        } catch (error) {
            if (error.message.includes('Validation error')) {
                resolve({
                    errCode: 2,
                    errMessage: 'Tên gói sản phẩm đã tồn tại'
                })
            }
            else {
                reject(error)
            }
        }
    })
}

let updatePackagePost = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.name || !data.price || !data.value || data.isHot === '' || !data.id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters !'
                })
            } else {
                let packagePost = await db.PackagePost.findOne({
                    where: { id: data.id },
                    raw: false
                })
                if (packagePost) {
                    packagePost.name = data.name
                    packagePost.price = data.price
                    packagePost.value = data.value
                    packagePost.isHot = data.isHot
                    await packagePost.save()
                    resolve({
                        errCode: 0,
                        errMessage: 'Cập nhật thành công'
                    })
                }
                else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Cập nhật thất bại'
                    })
                }
            }
        } catch (error) {
            if (error.message.includes('Validation error')) {
                resolve({
                    errCode: 2,
                    errMessage: 'Tên gói sản phẩm đã tồn tại'
                })
            }
            else {
                reject(error)
            }
        }
    })
}

let getStatisticalPackage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.fromDate || !data.toDate) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters !'
                })
            }
            else {
                let listPackage = await db.PackagePost.findAndCountAll({
                    limit: +data.limit,
                    offset: +data.offset,
                })
                let listOrderPackage = await db.OrderPackage.findAll({
                    where: {
                        createdAt: { [Op.and]: [{ [Op.gte]: `${data.fromDate} 00:00:00` }, { [Op.lte]: `${data.toDate} 23:59:59` }] }
                    },
                    attributes: ['packagePostId',[db.sequelize.literal('SUM(currentPrice * amount)'), 'total']],
                    order: [[db.Sequelize.literal('total'), 'DESC']],
                    group: ['packagePostId'],
                    nest: true,
                })
                const sum = listOrderPackage.reduce(
                    (previousValue, currentValue) => previousValue + currentValue.total,
                    0
                  );
                listPackage.rows = listPackage.rows.map(packagePost => {
                    let count = 1
                    let length = listOrderPackage.length
                    if (length == 0) {
                        return {
                            ...packagePost,
                            total: 0
                        }
                    }
                    for (let order of listOrderPackage) {
                        if (order.packagePostId == packagePost.id) {
                            return {
                                ...packagePost,
                                total: order.total
                            }
                        }
                        else if (count == length) {
                            return {
                                ...packagePost,
                                total: 0
                            }
                        }
                        count++
                    }
                }
                )
                resolve({
                    errCode: 0,
                    data: listPackage.rows,
                    count: listPackage.count,
                    sum: sum
                })
            }
        }
        catch (error) {
            reject(error)
        }
    })
}
module.exports = {
    getPackageByType, getPaymentLink, paymentOrderSuccess, getAllPackage, setActiveTypePackage,
    getPackageById, creatNewPackagePost, updatePackagePost, getStatisticalPackage
}