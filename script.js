      // লগইন ব্যবস্থাপনা
function login() {
    const password = document.getElementById('password').value;
    const loginFail = document.getElementById('login-fail');
    
    if (password === '709669') {
        document.getElementById('login-modal').classList.add('hidden');
        document.querySelector('header').classList.remove('hidden');
        document.querySelector('nav').classList.remove('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        loginFail.style.display = 'none';
        
        // প্রাথমিক সেটআপ শুরু করুন
        initializeSystem();
    } else {
        loginFail.style.display = 'block';
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// পাসওয়ার্ড ফিল্ডে এন্টার চাপলে লগইন করুন
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

// ডেটা স্টোরেজ (লোকাল স্টোরেজ ব্যবহার করা হবে)
let workers = JSON.parse(localStorage.getItem('workers')) || [];
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let rawMaterials = JSON.parse(localStorage.getItem('rawMaterials')) || [];
let productions = JSON.parse(localStorage.getItem('productions')) || [];
let bankTransactions = JSON.parse(localStorage.getItem('bankTransactions')) || [];
let stockAdjustments = JSON.parse(localStorage.getItem('stockAdjustments')) || [];
let banks = JSON.parse(localStorage.getItem('banks')) || [
    { name: "সোনালী ব্যাংক", balance: 0 },
    { name: "জনতা ব্যাংক", balance: 0 },
    { name: "রূপালী ব্যাংক", balance: 0 }
];
let cashBalance = parseFloat(localStorage.getItem('cashBalance')) || 0;

// নতুন ডেটা স্ট্রাকচার
let salaryPayments = JSON.parse(localStorage.getItem('salaryPayments')) || [];
let advanceSalaries = JSON.parse(localStorage.getItem('advanceSalaries')) || [];
let supplierPayments = JSON.parse(localStorage.getItem('supplierPayments')) || [];
let customerReceipts = JSON.parse(localStorage.getItem('customerReceipts')) || [];

// কাচামাল স্টক ডেটা
let rawMaterialStock = JSON.parse(localStorage.getItem('rawMaterialStock')) || {
    "এলুমিনিয়াম": 0,
    "স্টিল": 0,
    "তামা": 0
};

// নতুন গ্লোবাল ভেরিয়েবল
let lastProducedProductId = null; // সর্বশেষ উৎপাদিত পণ্য ট্র্যাক করার জন্য

// অটো-সেভ ব্যবস্থাপনা
let autoSaveInterval;
let isDataChanged = false;
let isSaving = false;

// সিস্টেম শুরু করুন
function initializeSystem() {
    // কড়াই-0 পণ্য যোগ করুন (যদি না থাকে)
    if (!products.find(p => p.id === 'K0')) {
        const karai0 = {
            id: 'K0',
            name: 'কড়াই-0',
            piecesPerBundle: 8,
            totalProduced: 0,
            totalBundles: 0,
            stockBundles: 0,
            stockPieces: 0,
            bundleWeights: []
        };
        products.push(karai0);
        markDataChanged();
    }
    
    // অটো-সেভ ব্যবস্থা শুরু করুন
    startAutoSave();
    
    // সকল টেবিল রিফ্রেশ করুন
    refreshWorkersTable();
    refreshSuppliersTable();
    refreshCustomersTable();
    refreshSaleCustomerList();
    refreshProductTab();
    refreshTransactionsTable();
    refreshMaterialSupplierList();
    refreshRawMaterialsTable();
    refreshRawMaterialShelves();
    refreshStockAdjustmentsTable();
    refreshSalesTable();
    refreshBankBalances();
    refreshBankTransactionsTable();
    refreshBankSelects();
    refreshStatementBankList();
    refreshQuickAttendanceTable();
    refreshAttendanceTable();
    refreshQuickProductionTable();
    refreshProductionTable();
    updateDashboard();
    
    // আজকের তারিখ সেট করুন
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quick-attendance-date').value = today;
    document.getElementById('quick-production-date').value = today;
    document.getElementById('material-date').value = today;
    document.getElementById('transaction-date').value = today;
    document.getElementById('sale-date').value = today;
    document.getElementById('bank-transaction-date').value = today;
    document.getElementById('salary-start-date').value = today;
    document.getElementById('statement-start-date').value = today;
    document.getElementById('statement-end-date').value = today;
    document.getElementById('adjustment-date').value = today;
    document.getElementById('production-date').value = today;
    document.getElementById('advance-date').value = today;
    document.getElementById('supplier-payment-date').value = today;
    document.getElementById('customer-receipt-date').value = today;
    
    // সপ্তাহের শেষ তারিখ সেট করুন
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);
    document.getElementById('salary-end-date').value = endDate.toISOString().split('T')[0];
    
    // লেনদেন ট্যাবের জন্য সাপ্লায়ার/ক্রেতা তালিকা রিফ্রেশ
    refreshTransactionSupplierList();
    refreshTransactionCustomerList();
    
    // বেতন ট্যাবের জন্য শ্রমিক তালিকা রিফ্রেশ
    refreshAdvanceWorkerList();
    
    // সাপ্লায়ার এবং ক্রেতা ব্যাংক লেনদেন ফর্মের জন্য তালিকা রিফ্রেশ
    refreshSupplierPaymentList();
    refreshCustomerReceiptList();
    
    // ইভেন্ট লিসেনার যোগ করুন
    setupEventListeners();
}

// ইভেন্ট লিসেনার সেটআপ
function setupEventListeners() {
    // অগ্রীম বেতন ফর্ম
    document.getElementById('advance-salary-form').addEventListener('submit', function(e) {
        e.preventDefault();
        takeAdvanceSalary();
    });
    
    // সাপ্লায়ার ব্যাংক পেমেন্ট ফর্ম
    document.getElementById('supplier-bank-payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        paySupplierThroughBank();
    });
    
    // ক্রেতা ব্যাংক রিসিপ্ট ফর্ম
    document.getElementById('customer-bank-receipt-form').addEventListener('submit', function(e) {
        e.preventDefault();
        receiveFromCustomerThroughBank();
    });
    
    // বান্ডিল ওজন ফর্ম
    document.getElementById('bundle-weight-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBundleWeights();
    });
    
    // বান্ডিল পণ্য নির্বাচন পরিবর্তনে
    document.getElementById('bundle-product').addEventListener('change', function() {
        refreshBundleList();
    });
}

// অটো-সেভ ব্যবস্থা শুরু করুন
function startAutoSave() {
    // প্রতি 60 সেকেন্ড পর পর ডেটা সেভ করুন
    autoSaveInterval = setInterval(function() {
        if (isDataChanged && !isSaving) {
            saveAllData();
        }
    }, 60000); // 60 সেকেন্ড = 60000 মিলিসেকেন্ড
}

// অটো-সেভ স্ট্যাটাস দেখান
function showAutoSaveStatus(message, type = 'success') {
    const statusElement = document.getElementById('auto-save-status');
    statusElement.textContent = message;
    statusElement.className = 'auto-save-status';
    
    if (type === 'saving') {
        statusElement.classList.add('saving');
    } else if (type === 'error') {
        statusElement.classList.add('error');
    }
    
    statusElement.style.display = 'block';
    setTimeout(function() {
        statusElement.style.display = 'none';
    }, 3000);
}

// সকল ডেটা সেভ করুন
function saveAllData() {
    isSaving = true;
    showAutoSaveStatus('ডেটা সেভ হচ্ছে...', 'saving');
    
    try {
        localStorage.setItem('workers', JSON.stringify(workers));
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('rawMaterials', JSON.stringify(rawMaterials));
        localStorage.setItem('productions', JSON.stringify(productions));
        localStorage.setItem('bankTransactions', JSON.stringify(bankTransactions));
        localStorage.setItem('stockAdjustments', JSON.stringify(stockAdjustments));
        localStorage.setItem('banks', JSON.stringify(banks));
        localStorage.setItem('cashBalance', cashBalance.toString());
        localStorage.setItem('rawMaterialStock', JSON.stringify(rawMaterialStock));
        localStorage.setItem('salaryPayments', JSON.stringify(salaryPayments));
        localStorage.setItem('advanceSalaries', JSON.stringify(advanceSalaries));
        localStorage.setItem('supplierPayments', JSON.stringify(supplierPayments));
        localStorage.setItem('customerReceipts', JSON.stringify(customerReceipts));
        
        isDataChanged = false;
        showAutoSaveStatus('ডেটা সফলভাবে সেভ করা হয়েছে');
    } catch (error) {
        console.error('ডেটা সেভ করতে সমস্যা:', error);
        showAutoSaveStatus('ডেটা সেভ করতে সমস্যা হয়েছে', 'error');
        
        // error হলে ৫ সেকেন্ড পর আবার চেষ্টা করুন
        setTimeout(() => {
            if (isDataChanged) {
                saveAllData();
            }
        }, 5000);
    } finally {
        isSaving = false;
    }
}

// ডেটা পরিবর্তন হয়েছে চিহ্নিত করুন
function markDataChanged() {
    isDataChanged = true;
}

// ট্যাব নেভিগেশন
document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // সক্রিয় ট্যাব আপডেট করুন
        document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // সক্রিয় ট্যাব কন্টেন্ট আপডেট করুন
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // নির্দিষ্ট ট্যাব লোড হলে ডেটা রিফ্রেশ করুন
        if(tabId === 'workers') refreshWorkersTable();
        if(tabId === 'suppliers') {
            refreshSuppliersTable();
            refreshSupplierPaymentList();
        }
        if(tabId === 'customers') {
            refreshCustomersTable();
            refreshSaleCustomerList();
            refreshCustomerReceiptList();
        }
        if(tabId === 'products') {
            refreshProductTab();
        }
        if(tabId === 'attendance') {
            refreshQuickAttendanceTable();
            refreshAttendanceTable();
        }
        if(tabId === 'salary') {
            refreshAdvanceWorkerList();
        }
        if(tabId === 'transactions') {
            refreshTransactionsTable();
            document.getElementById('transaction-cash-balance').textContent = `৳ ${cashBalance.toFixed(2)}`;
        }
        if(tabId === 'dashboard') updateDashboard();
        if(tabId === 'raw-materials') {
            refreshMaterialSupplierList();
            refreshRawMaterialsTable();
            refreshRawMaterialShelves();
            refreshStockAdjustmentsTable();
            // সম্পাদনা ফর্মের জন্য সাপ্লায়ার তালিকা রিফ্রেশ
            refreshEditMaterialSupplierList();
        }
        if(tabId === 'production') {
            refreshQuickProductionTable();
            refreshProductionTable();
            refreshBundleProductList();
            
            // স্বয়ংক্রিয়ভাবে বান্ডিল সেকশনে স্ক্রল করুন যদি নতুন উৎপাদন থাকে
            if (lastProducedProductId) {
                setTimeout(() => {
                    const product = products.find(p => p.id === lastProducedProductId);
                    if (product && product.stockBundles > 0) {
                        document.getElementById('bundle-product').value = lastProducedProductId;
                        refreshBundleList();
                        
                        // বান্ডিল ফর্মে স্ক্রল করুন
                        document.getElementById('bundle-weight-form').scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }, 1000);
            }
        }
        if(tabId === 'sales') {
            refreshSalesTable();
            refreshSaleCustomerList();
            refreshSaleProductList();
        }
        if(tabId === 'bank-management') {
            refreshBankBalances();
            refreshBankTransactionsTable();
            refreshBankSelects();
            refreshStatementBankList();
        }
    });
});

// ============================================
// ১. বেতন ব্যবস্থাপনা উন্নয়ন
// ============================================

// বেতন পরিশোধ করুন - উন্নত সংস্করণ (ডুপ্লিকেট পেমেন্ট প্রতিরোধ সহ)
function paySalary(workerId, salaryAmount, event) {
    // আগেই পরিশোধিত কিনা চেক করুন
    const today = new Date().toISOString().split('T')[0];
    
    // একই দিনে একই শ্রমিকের বেতন পরিশোধিত কিনা চেক করুন
    const alreadyPaidToday = salaryPayments.some(payment => 
        payment.workerId === workerId && 
        payment.date === today &&
        payment.amount === salaryAmount
    );
    
    if (alreadyPaidToday) {
        alert(`${workerId} আইডির শ্রমিকের বেতন আজ ইতিমধ্যে পরিশোধ করা হয়েছে!`);
        
        // বাটন সক্রিয় করুন
        if (event && event.target) {
            event.target.disabled = false;
            event.target.textContent = 'পরিশোধ';
            event.target.style.backgroundColor = '';
            event.target.style.cursor = '';
        }
        return;
    }
    
    // বাটন নিষ্ক্রিয় করুন
    const payButton = event.target;
    payButton.disabled = true;
    payButton.textContent = 'পরিশোধ হচ্ছে...';
    payButton.style.backgroundColor = '#cccccc';
    payButton.style.cursor = 'not-allowed';
    
    // ১ সেকেন্ড পরে প্রক্রিয়া শুরু করুন (ইউজার এক্সপেরিয়েন্সের জন্য)
    setTimeout(() => {
        if (cashBalance >= salaryAmount) {
            const worker = workers.find(w => w.id === workerId);
            if (!worker) {
                alert('শ্রমিক পাওয়া যায়নি!');
                // বাটন সক্রিয় করুন
                payButton.disabled = false;
                payButton.textContent = 'পরিশোধ';
                payButton.style.backgroundColor = '';
                payButton.style.cursor = '';
                return;
            }
            
            cashBalance -= salaryAmount;
            
            // বেতন পরিশোধ রেকর্ড যোগ করুন
            const payment = {
                workerId: workerId,
                amount: salaryAmount,
                date: today,
                type: 'salary',
                paymentId: 'PAY_' + Date.now() + '_' + workerId, // ইউনিক পেমেন্ট আইডি
                status: 'completed'
            };
            salaryPayments.push(payment);
            
            // লেনদেন রেকর্ড যোগ করুন
            const transaction = {
                date: today,
                type: 'বেতন',
                amount: salaryAmount,
                description: `${worker.name} (${workerId}) - বেতন পরিশোধ`,
                reference: payment.paymentId
            };
            transactions.push(transaction);
            
            markDataChanged();
            saveAllData();
            
            // বাটন স্থায়ীভাবে নিষ্ক্রিয় করুন (এই সেশন/পেজের জন্য)
            payButton.disabled = true;
            payButton.textContent = 'পরিশোধিত ✓';
            payButton.style.backgroundColor = '#95a5a6';
            
            alert(`বেতন পরিশোধ করা হয়েছে! পরিমাণ: ৳ ${salaryAmount.toFixed(2)}`);
            updateDashboard();
            refreshTransactionsTable();
            
            // পরিশোধ রসিদ প্রিন্ট করুন
            printPaymentReceipt(worker, salaryAmount);
        } else {
            alert(`নগদ ব্যালেন্স পর্যাপ্ত নেই! বর্তমান ব্যালেন্স: ৳ ${cashBalance.toFixed(2)}, প্রয়োজন: ৳ ${salaryAmount.toFixed(2)}`);
            // বাটন সক্রিয় করুন
            payButton.disabled = false;
            payButton.textContent = 'পরিশোধ';
            payButton.style.backgroundColor = '';
            payButton.style.cursor = '';
        }
    }, 1000);
}

// অগ্রীম বেতন গ্রহণ করুন
function takeAdvanceSalary() {
    const workerId = document.getElementById('advance-worker-id').value;
    const amount = parseFloat(document.getElementById('advance-amount').value);
    const date = document.getElementById('advance-date').value;
    
    if (!workerId || !amount || amount <= 0) {
        alert('সঠিক তথ্য প্রদান করুন!');
        return;
    }
    
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
        alert('শ্রমিক পাওয়া যায়নি!');
        return;
    }
    
    // অগ্রীম বেতন রেকর্ড যোগ করুন
    const advance = {
        workerId: workerId,
        amount: amount,
        date: date,
        deducted: false
    };
    advanceSalaries.push(advance);
    
    // নগদ ব্যালেন্স হ্রাস করুন
    cashBalance -= amount;
    
    // লেনদেন রেকর্ড যোগ করুন
    const transaction = {
        date: date,
        type: 'বেতন',
        amount: amount,
        description: `${worker.name} (${workerId}) - অগ্রীম বেতন`
    };
    transactions.push(transaction);
    
    markDataChanged();
    saveAllData();
    
    alert(`অগ্রীম বেতন গ্রহণ করা হয়েছে! পরিমাণ: ৳ ${amount.toFixed(2)}`);
    document.getElementById('advance-salary-form').reset();
    updateDashboard();
    refreshTransactionsTable();
}

// বেতন গণনা করার সময় অগ্রীম বেতন সমন্বয় করুন
function adjustAdvanceSalary(workerId, calculatedSalary, startDate, endDate) {
    // নির্দিষ্ট সময়ের মধ্যে নেওয়া অগ্রীম বেতন গণনা করুন
    const advances = advanceSalaries.filter(advance => 
        advance.workerId === workerId && 
        advance.date >= startDate && 
        advance.date <= endDate &&
        !advance.deducted
    );
    
    let totalAdvance = advances.reduce((sum, advance) => sum + advance.amount, 0);
    
    // অগ্রীম বেতন সমন্বয় করুন
    const adjustedSalary = Math.max(0, calculatedSalary - totalAdvance);
    
    // অগ্রীম বেতনকে ডিডাক্টেড হিসেবে চিহ্নিত করুন
    advances.forEach(advance => {
        advance.deducted = true;
    });
    
    return {
        calculatedSalary: calculatedSalary,
        advanceDeduction: totalAdvance,
        finalSalary: adjustedSalary,
        advances: advances
    };
}

// পৃথক বেতন সিট প্রিন্ট করুন
function printIndividualSalarySheets() {
    const startDate = document.getElementById('salary-start-date').value;
    const endDate = document.getElementById('salary-end-date').value;
    
    if (!startDate || !endDate) {
        alert('শুরু এবং শেষ তারিখ নির্বাচন করুন!');
        return;
    }
    
    let salaryData = calculateAllSalaries(startDate, endDate);
    
    if (salaryData.length === 0) {
        alert('এই সময়কালে কোন বেতন ডেটা পাওয়া যায়নি');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>পৃথক বেতন সিট</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .salary-sheet { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; page-break-after: always; }
                .salary-header { text-align: center; margin-bottom: 20px; }
                .salary-header h3 { font-size: 24px; margin-bottom: 10px; }
                .salary-header p { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .signature-area { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature-box { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
            </style>
        </head>
        <body>
    `;
    
    salaryData.forEach(data => {
        const adjustment = adjustAdvanceSalary(data.workerId, data.salary, startDate, endDate);
        
        printContent += `
            <div class="salary-sheet">
                <div class="salary-header">
                    <h3>Zafrul Metal</h3>
                    <p>রংপুর রোড, বগুড়া</p>
                    <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                    <p>বেতন স্টেটমেন্ট</p>
                    <p>শ্রমিক: ${data.workerName} (${data.workerId})</p>
                    <p>সময়কাল: ${startDate} থেকে ${endDate}</p>
                </div>
                <table>
                    <tr>
                        <th>বিবরণ</th>
                        <th>পরিমাণ (৳)</th>
                    </tr>
                    <tr>
                        <td>মোট বেতন</td>
                        <td>৳ ${data.salary.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>অগ্রীম বেতন (বিয়োগ)</td>
                        <td>৳ ${adjustment.advanceDeduction.toFixed(2)}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td>পরিশোধযোগ্য বেতন</td>
                        <td>৳ ${adjustment.finalSalary.toFixed(2)}</td>
                    </tr>
                </table>
                <div class="signature-area">
                    <div class="signature-box">
                        <p>প্রদানকারীর স্বাক্ষর</p>
                    </div>
                    <div class="signature-box">
                        <p>গ্রহীতার স্বাক্ষর</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    printContent += `</body></html>`;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// যৌথ বেতন সিট প্রিন্ট করুন
function printCombinedSalarySheet() {
    const startDate = document.getElementById('salary-start-date').value;
    const endDate = document.getElementById('salary-end-date').value;
    
    if (!startDate || !endDate) {
        alert('শুরু এবং শেষ তারিখ নির্বাচন করুন!');
        return;
    }
    
    let salaryData = calculateAllSalaries(startDate, endDate);
    
    if (salaryData.length === 0) {
        alert('এই সময়কালে কোন বেতন ডেটা পাওয়া যায়নি');
        return;
    }
    
    let totalSalary = 0;
    let totalAdvance = 0;
    let totalPayable = 0;
    
    const printWindow = window.open('', '_blank');
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>যৌথ বেতন সিট</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .salary-sheet { border: 1px solid #ddd; padding: 20px; }
                .salary-header { text-align: center; margin-bottom: 20px; }
                .salary-header h3 { font-size: 24px; margin-bottom: 10px; }
                .salary-header p { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                tfoot tr { font-weight: bold; background-color: #f8f9fa; }
            </style>
        </head>
        <body>
        <div class="salary-sheet">
            <div class="salary-header">
                <h3>Zafrul Metal</h3>
                <p>রংপুর রোড, বগুড়া</p>
                <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                <p>যৌথ বেতন স্টেটমেন্ট</p>
                <p>সময়কাল: ${startDate} থেকে ${endDate}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>শ্রমিক আইডি</th>
                        <th>নাম</th>
                        <th>মোট বেতন</th>
                        <th>অগ্রীম বেতন</th>
                        <th>পরিশোধযোগ্য</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    salaryData.forEach(data => {
        const adjustment = adjustAdvanceSalary(data.workerId, data.salary, startDate, endDate);
        
        totalSalary += data.salary;
        totalAdvance += adjustment.advanceDeduction;
        totalPayable += adjustment.finalSalary;
        
        printContent += `
            <tr>
                <td>${data.workerId}</td>
                <td>${data.workerName}</td>
                <td>৳ ${data.salary.toFixed(2)}</td>
                <td>৳ ${adjustment.advanceDeduction.toFixed(2)}</td>
                <td>৳ ${adjustment.finalSalary.toFixed(2)}</td>
            </tr>
        `;
    });
    
    printContent += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">মোট</td>
                        <td>৳ ${totalSalary.toFixed(2)}</td>
                        <td>৳ ${totalAdvance.toFixed(2)}</td>
                        <td>৳ ${totalPayable.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// পরিশোধ রসিদ প্রিন্ট করুন
function printPaymentReceipt(worker, amount) {
    const printWindow = window.open('', '_blank');
    const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>পরিশোধ রসিদ</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .receipt { border: 2px solid #000; padding: 30px; width: 400px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { font-size: 24px; margin-bottom: 5px; }
                .header p { margin: 3px 0; }
                .details { margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .signature { margin-top: 40px; text-align: center; }
                .stamp { position: absolute; right: 50px; top: 200px; width: 100px; height: 100px; border: 2px solid red; display: flex; align-items: center; justify-content: center; transform: rotate(10deg); }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h2>Zafrul Metal</h2>
                    <p>রংপুর রোড, বগুড়া</p>
                    <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                    <h3>পরিশোধ রসিদ</h3>
                </div>
                <div class="details">
                    <div class="detail-row">
                        <span>তারিখ:</span>
                        <span>${new Date().toLocaleDateString('bn-BD')}</span>
                    </div>
                    <div class="detail-row">
                        <span>রসিদ নং:</span>
                        <span>${Date.now()}</span>
                    </div>
                    <div class="detail-row">
                        <span>শ্রমিক নাম:</span>
                        <span>${worker.name}</span>
                    </div>
                    <div class="detail-row">
                        <span>শ্রমিক আইডি:</span>
                        <span>${worker.id}</span>
                    </div>
                    <div class="detail-row">
                        <span>পরিশোধের ধরন:</span>
                        <span>বেতন</span>
                    </div>
                    <div class="detail-row" style="font-weight: bold; font-size: 18px; margin-top: 20px;">
                        <span>পরিমাণ:</span>
                        <span>৳ ${amount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row" style="margin-top: 10px;">
                        <span>টাকার কথায়:</span>
                        <span>${convertToWords(amount)} টাকা</span>
                    </div>
                </div>
                <div class="signature">
                    <p>_________________________</p>
                    <p>প্রদানকারীর স্বাক্ষর</p>
                </div>
                <div class="stamp">
                    <span style="color: red; font-weight: bold;">PAID</span>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
}

// সংখ্যাকে কথায় রূপান্তর করুন
function convertToWords(number) {
    const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ'];
    const tens = ['', 'দশ', 'বিশ', 'তিরিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
    
    if (number === 0) return 'শূন্য';
    
    let words = '';
    let num = Math.floor(number);
    
    if (num >= 100) {
        words += ones[Math.floor(num / 100)] + ' শত ';
        num %= 100;
    }
    
    if (num >= 10) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    }
    
    if (num > 0) {
        words += ones[num] + ' ';
    }
    
    return words.trim();
}

// সকল শ্রমিকের বেতন গণনা করুন
function calculateAllSalaries(startDate, endDate) {
    let salaryData = [];
    
    workers.forEach(worker => {
        let workerSalary = 0;
        
        if (worker.salaryType === 'সাপ্তাহিক') {
            // হাজিরা ভিত্তিক বেতন গণনা
            const workerAttendance = attendance.filter(a => 
                a.workerId === worker.id && 
                a.date >= startDate && 
                a.date <= endDate
            );
            
            const presentDays = workerAttendance.filter(a => a.status === 'present').length;
            workerSalary = (presentDays / 6) * worker.salaryAmount;
        } else if (worker.salaryType === 'প্রডাকশন ভিত্তিক') {
            // উৎপাদন ভিত্তিক বেতন গণনা
            const workerProductions = productions.filter(p => 
                p.workerId === worker.id && 
                p.date >= startDate && 
                p.date <= endDate
            );
            
            workerProductions.forEach(production => {
                workerSalary += production.quantity * worker.salaryAmount;
            });
        }
        
        if (workerSalary > 0) {
            salaryData.push({
                workerId: worker.id,
                workerName: worker.name,
                salary: workerSalary,
                salaryType: worker.salaryType
            });
        }
    });
    
    return salaryData;
}

// অগ্রীম বেতনের জন্য শ্রমিক তালিকা রিফ্রেশ
function refreshAdvanceWorkerList() {
    const select = document.getElementById('advance-worker-id');
    if (select) {
        select.innerHTML = '<option value="">শ্রমিক নির্বাচন করুন</option>';
        workers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = `${worker.name} (${worker.id})`;
            select.appendChild(option);
        });
    }
}

// ============================================
// ২. ব্যাংক ব্যবস্থাপনা উন্নয়ন
// ============================================

// ব্যাংক মাধ্যমে সাপ্লায়ারকে পেমেন্ট করুন
function paySupplierThroughBank() {
    const supplierId = document.getElementById('supplier-payment-supplier').value;
    const amount = parseFloat(document.getElementById('supplier-payment-amount').value);
    const bankName = document.getElementById('supplier-payment-bank').value;
    const date = document.getElementById('supplier-payment-date').value;
    const description = document.getElementById('supplier-payment-description').value;
    
    if (!supplierId || !amount || amount <= 0 || !bankName) {
        alert('সঠিক তথ্য প্রদান করুন!');
        return;
    }
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        alert('সাপ্লায়ার পাওয়া যায়নি!');
        return;
    }
    
    const bank = banks.find(b => b.name === bankName);
    if (!bank) {
        alert('ব্যাংক পাওয়া যায়নি!');
        return;
    }
    
    if (bank.balance < amount) {
        alert(`ব্যাংক ব্যালেন্স পর্যাপ্ত নেই! ${bankName} ব্যালেন্স: ৳ ${bank.balance.toFixed(2)}, প্রয়োজন: ৳ ${amount.toFixed(2)}`);
        return;
    }
    
    // ব্যাংক ব্যালেন্স হ্রাস করুন
    bank.balance -= amount;
    
    // সাপ্লায়ার পেমেন্ট রেকর্ড যোগ করুন
    const payment = {
        supplierId: supplierId,
        amount: amount,
        bankName: bankName,
        date: date,
        description: description || `${supplier.name} - পেমেন্ট`
    };
    supplierPayments.push(payment);
    
    // ব্যাংক লেনদেন রেকর্ড যোগ করুন
    const bankTransaction = {
        date: date,
        bankName: bankName,
        type: 'উত্তোলন',
        amount: amount,
        description: description || `${supplier.name} (${supplierId}) - সাপ্লায়ার পেমেন্ট`
    };
    bankTransactions.push(bankTransaction);
    
    markDataChanged();
    saveAllData();
    
    alert(`সাপ্লায়ারকে পেমেন্ট করা হয়েছে! পরিমাণ: ৳ ${amount.toFixed(2)}`);
    document.getElementById('supplier-bank-payment-form').reset();
    refreshBankBalances();
    refreshBankTransactionsTable();
}

// ব্যাংক মাধ্যমে ক্রেতার কাছ থেকে টাকা গ্রহণ করুন
function receiveFromCustomerThroughBank() {
    const customerId = document.getElementById('customer-receipt-customer').value;
    const amount = parseFloat(document.getElementById('customer-receipt-amount').value);
    const bankName = document.getElementById('customer-receipt-bank').value;
    const date = document.getElementById('customer-receipt-date').value;
    const description = document.getElementById('customer-receipt-description').value;
    
    if (!customerId || !amount || amount <= 0 || !bankName) {
        alert('সঠিক তথ্য প্রদান করুন!');
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        alert('ক্রেতা পাওয়া যায়নি!');
        return;
    }
    
    const bank = banks.find(b => b.name === bankName);
    if (!bank) {
        alert('ব্যাংক পাওয়া যায়নি!');
        return;
    }
    
    // ক্রেতার বকেয়া হ্রাস করুন
    if (customer.due < amount) {
        alert(`ক্রেতার বকেয়ার চেয়ে বেশি পরিমাণ! বকেয়া: ৳ ${customer.due.toFixed(2)}, পরিমাণ: ৳ ${amount.toFixed(2)}`);
        return;
    }
    
    customer.due -= amount;
    
    // ব্যাংক ব্যালেন্স বৃদ্ধি করুন
    bank.balance += amount;
    
    // ক্রেতা রিসিপ্ট রেকর্ড যোগ করুন
    const receipt = {
        customerId: customerId,
        amount: amount,
        bankName: bankName,
        date: date,
        description: description || `${customer.name} - টাকা জমা`
    };
    customerReceipts.push(receipt);
    
    // ব্যাংক লেনদেন রেকর্ড যোগ করুন
    const bankTransaction = {
        date: date,
        bankName: bankName,
        type: 'জমা',
        amount: amount,
        description: description || `${customer.name} (${customerId}) - ক্রেতা পেমেন্ট`
    };
    bankTransactions.push(bankTransaction);
    
    markDataChanged();
    saveAllData();
    
    alert(`ক্রেতার কাছ থেকে টাকা গ্রহণ করা হয়েছে! পরিমাণ: ৳ ${amount.toFixed(2)}`);
    document.getElementById('customer-bank-receipt-form').reset();
    refreshBankBalances();
    refreshBankTransactionsTable();
    refreshCustomersTable();
}

// সাপ্লায়ার পেমেন্টের জন্য সাপ্লায়ার তালিকা রিফ্রেশ
function refreshSupplierPaymentList() {
    const select = document.getElementById('supplier-payment-supplier');
    if (select) {
        select.innerHTML = '<option value="">সাপ্লায়ার নির্বাচন করুন</option>';
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = `${supplier.name} (${supplier.id})`;
            select.appendChild(option);
        });
    }
}

// ক্রেতা রিসিপ্টের জন্য ক্রেতা তালিকা রিফ্রেশ
function refreshCustomerReceiptList() {
    const select = document.getElementById('customer-receipt-customer');
    if (select) {
        select.innerHTML = '<option value="">ক্রেতা নির্বাচন করুন</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.id}) - বকেয়া: ৳ ${customer.due.toFixed(2)}`;
            select.appendChild(option);
        });
    }
}

// ============================================
// ৩. কাচামাল স্টক ব্যবস্থাপনা উন্নয়ন
// ============================================

// কাচামাল ডিলিট করুন - উন্নত সংস্করণ
function deleteRawMaterial(index) {
    if(confirm(`আপনি কি এই কাচামাল এন্ট্রি মুছে ফেলতে চান?`)) {
        const material = rawMaterials[index];
        
        // ১. কাচামাল স্টক থেকে বাদ দিন
        rawMaterialStock[material.type] -= material.weight;
        
        // ২. পেমেন্ট পদ্ধতি অনুযায়ী ব্যালেন্স পূর্বাবস্থায় ফেরান
        if (material.paymentMethod === 'cash') {
            cashBalance += material.total;
        } else if (material.paymentMethod === 'bank') {
            const bank = banks.find(b => b.name === material.bankName);
            if (bank) {
                bank.balance += material.total;
            }
        }
        
        // ৩. সংশ্লিষ্ট লেনদেন ডিলিট করুন
        if (material.paymentMethod === 'cash' || material.paymentMethod === 'bank') {
            const transactionIndex = transactions.findIndex(t => 
                t.description.includes(`${material.type} কাচামাল ক্রয়`) && 
                t.amount === material.total
            );
            if (transactionIndex !== -1) {
                transactions.splice(transactionIndex, 1);
            }
        }
        
        // ৪. কাচামাল রেকর্ড সম্পূর্ণরূপে ডিলিট করুন
        rawMaterials.splice(index, 1);
        
        markDataChanged();
        saveAllData();
        
        alert('কাচামাল সফলভাবে মুছে ফেলা হয়েছে!');
        refreshRawMaterialsTable();
        refreshRawMaterialShelves();
        updateDashboard();
        refreshBankBalances();
        refreshTransactionsTable();
    }
}

// স্টক সমন্বয় ডিলিট করুন - উন্নত সংস্করণ
function deleteStockAdjustment(index) {
    if(confirm(`আপনি কি এই স্টক সমন্বয় মুছে ফেলতে চান?`)) {
        const adjustment = stockAdjustments[index];
        
        // ১. কাচামাল স্টক পূর্বাবস্থায় ফেরান
        if (adjustment.type === 'যোগ') {
            rawMaterialStock[adjustment.material] -= adjustment.weight;
        } else if (adjustment.type === 'বিয়োগ') {
            rawMaterialStock[adjustment.material] += adjustment.weight;
        }
        
        // ২. স্টক সমন্বয় রেকর্ড সম্পূর্ণরূপে ডিলিট করুন
        stockAdjustments.splice(index, 1);
        
        markDataChanged();
        saveAllData();
        
        alert('স্টক সমন্বয় সফলভাবে মুছে ফেলা হয়েছে!');
        refreshStockAdjustmentsTable();
        refreshRawMaterialShelves();
        updateDashboard();
    }
}

// ============================================
// ৪. বান্ডিল ওজন ব্যবস্থাপনা উন্নয়ন
// ============================================

// বান্ডিল ওজন সেভ করুন - উন্নত সংস্করণ
function saveBundleWeights() {
    const productId = document.getElementById('bundle-product').value;
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert('পণ্য পাওয়া যায়নি!');
        return;
    }
    
    // বান্ডিল ওজন সংগ্রহ করুন
    const weightInputs = document.querySelectorAll('.bundle-weight-input');
    let allWeightsFilled = true;
    let totalWeight = 0;
    let weightsArray = [];
    
    weightInputs.forEach((input, index) => {
        const weight = parseFloat(input.value);
        if (isNaN(weight) || weight <= 0) {
            allWeightsFilled = false;
        } else {
            totalWeight += weight;
            weightsArray.push(weight);
        }
    });
    
    if (!allWeightsFilled) {
        alert('সমস্ত বান্ডিলের ওজন প্রদান করুন!');
        return;
    }
    
    // কাচামাল স্টক থেকে মোট ওজন বিয়োগ করুন
    if (rawMaterialStock['এলুমিনিয়াম'] < totalWeight) {
        alert(`পর্যাপ্ত এলুমিনিয়াম স্টক নেই! উপলব্ধ: ${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)} কেজি, প্রয়োজন: ${totalWeight.toFixed(2)} কেজি`);
        return;
    }
    
    rawMaterialStock['এলুমিনিয়াম'] -= totalWeight;
    
    // পণ্যের গড় ওজন আপডেট করুন
    const avgWeight = totalWeight / weightInputs.length;
    
    // বান্ডিল ওজন সংরক্ষণ করুন
    weightsArray.forEach((weight, index) => {
        product.bundleWeights[index] = {
            weight: weight,
            date: new Date().toISOString().split('T')[0]
        };
    });
    
    markDataChanged();
    saveAllData();
    
    // সফল মেসেজ
    alert(`বান্ডিল ওজন সফলভাবে সংরক্ষণ করা হয়েছে!\nমোট ওজন: ${totalWeight.toFixed(2)} কেজি\nগড় ওজন: ${avgWeight.toFixed(2)} কেজি\nএলুমিনিয়াম স্টক থেকে বিয়োগ করা হয়েছে: ${totalWeight.toFixed(2)} কেজি`);
    
    // UI রিফ্রেশ করুন
    refreshProductTab();
    refreshBundleList();
    refreshRawMaterialShelves();
    updateDashboard();
    
    // ফর্ম ক্লিয়ার করুন (ঐচ্ছিক)
    setTimeout(() => {
        document.getElementById('bundle-weight-form').reset();
        refreshBundleList();
    }, 1000);
}

// বান্ডিল তালিকা রিফ্রেশ
function refreshBundleList() {
    const productId = document.getElementById('bundle-product').value;
    const product = products.find(p => p.id === productId);
    const bundleList = document.getElementById('bundle-list');
    
    if (!product) {
        bundleList.innerHTML = '<p>পণ্য নির্বাচন করুন</p>';
        return;
    }
    
    if (product.stockBundles === 0) {
        bundleList.innerHTML = '<p>এই পণ্যের কোন বান্ডিল স্টক নেই</p>';
        return;
    }
    
    let html = '<h4>বান্ডিল ওজন ইনপুট:</h4>';
    
    // মোট ওজন ট্র্যাক করার জন্য
    let totalWeight = 0;
    
    for (let i = 0; i < product.stockBundles; i++) {
        const currentWeight = product.bundleWeights[i] ? product.bundleWeights[i].weight : '';
        const bundleDate = product.bundleWeights[i] ? product.bundleWeights[i].date : new Date().toISOString().split('T')[0];
        
        if (currentWeight) {
            totalWeight += parseFloat(currentWeight);
        }
        
        html += `
            <div class="form-group">
                <label for="bundle-weight-${i}">বান্ডিল ${i+1} ওজন (কেজি) - তারিখ: ${bundleDate}</label>
                <input type="number" id="bundle-weight-${i}" class="bundle-weight-input" step="0.01" value="${currentWeight}" required>
            </div>
        `;
    }
    
    // মোট ওজন দেখান
    html += `<div style="margin: 15px 0; padding: 10px; background-color: #e9ecef; border-radius: 3px;">
                <strong>মোট ওজন:</strong> ${totalWeight.toFixed(2)} কেজি<br>
                <strong>বান্ডিল সংখ্যা:</strong> ${product.stockBundles}<br>
                <strong>এই ওজন এলুমিনিয়াম স্টক থেকে বিয়োগ হবে</strong><br>
                <strong>উপলব্ধ এলুমিনিয়াম:</strong> ${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)} কেজি
            </div>`;
    
    // সাবমিট বাটন (যদি না থাকে)
    if (!document.querySelector('#bundle-list button')) {
        html += `<button type="submit" class="btn-success" style="margin-top: 10px;">ওজন সংরক্ষণ করুন</button>`;
    }
    
    bundleList.innerHTML = html;
}

// স্টক রিপোর্ট রিফ্রেশ - উন্নত সংস্করণ
function refreshStockReport() {
    const table = document.getElementById('stock-report-table');
    table.innerHTML = '';
    
    if (products.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">কোন পণ্য ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    let totalBundles = 0;
    let totalPieces = 0;
    let totalWeight = 0;
    
    products.forEach(product => {
        // গড় ওজন এবং মোট ওজন গণনা করুন
        let avgWeight = 0;
        let productTotalWeight = 0;
        
        if (product.bundleWeights.length > 0) {
            productTotalWeight = product.bundleWeights.reduce((sum, bundle) => sum + bundle.weight, 0);
            avgWeight = productTotalWeight / product.bundleWeights.length;
        }
        
        totalBundles += product.stockBundles;
        totalPieces += product.stockPieces;
        totalWeight += productTotalWeight;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.stockBundles}</td>
            <td>${product.stockPieces}</td>
            <td>${avgWeight > 0 ? avgWeight.toFixed(2) : 'N/A'}</td>
            <td>${productTotalWeight > 0 ? productTotalWeight.toFixed(2) : 'N/A'}</td>
        `;
        table.appendChild(row);
    });
    
    // টোটাল সারি যোগ করুন
    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = '#f8f9fa';
    totalRow.innerHTML = `
        <td colspan="2">মোট</td>
        <td>${totalBundles}</td>
        <td>${totalPieces}</td>
        <td>-</td>
        <td>${totalWeight.toFixed(2)}</td>
    `;
    table.appendChild(totalRow);
}

// ============================================
// ৫. স্টক রিপোর্ট প্রিন্ট কপিতে মোট ওজন দেখানো
// ============================================

// পণ্য স্টক রিপোর্ট প্রিন্ট করুন - উন্নত সংস্করণ
function printProductStockReport() {
    let totalBundles = 0;
    let totalPieces = 0;
    let totalWeight = 0;
    
    let reportRows = '';
    
    products.forEach(product => {
        // গড় ওজন এবং মোট ওজন গণনা করুন
        let avgWeight = 0;
        let productTotalWeight = 0;
        
        if (product.bundleWeights.length > 0) {
            productTotalWeight = product.bundleWeights.reduce((sum, bundle) => sum + bundle.weight, 0);
            avgWeight = productTotalWeight / product.bundleWeights.length;
        }
        
        totalBundles += product.stockBundles;
        totalPieces += product.stockPieces;
        totalWeight += productTotalWeight;
        
        reportRows += `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.stockBundles}</td>
                <td>${product.stockPieces}</td>
                <td>${avgWeight > 0 ? avgWeight.toFixed(2) : 'N/A'}</td>
                <td>${productTotalWeight > 0 ? productTotalWeight.toFixed(2) : 'N/A'}</td>
            </tr>
        `;
    });
    
    const reportContent = `
        <div class="salary-sheet">
            <div class="salary-header">
                <h3>Zafrul Metal</h3>
                <p>রংপুর রোড, বগুড়া</p>
                <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                <p>পণ্য স্টক রিপোর্ট</p>
                <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
            </div>
            <div class="statement-summary">
                <div class="statement-summary-item">
                    <div class="statement-summary-label">মোট বান্ডিল</div>
                    <div class="statement-summary-value">${totalBundles}</div>
                </div>
                <div class="statement-summary-item">
                    <div class="statement-summary-label">মোট পিচ</div>
                    <div class="statement-summary-value">${totalPieces}</div>
                </div>
                <div class="statement-summary-item">
                    <div class="statement-summary-label">মোট ওজন (কেজি)</div>
                    <div class="statement-summary-value">${totalWeight.toFixed(2)}</div>
                </div>
            </div>
            <table class="salary-table stock-report-table">
                <thead>
                    <tr>
                        <th>পণ্য আইডি</th>
                        <th>পণ্যের নাম</th>
                        <th>স্টক (বান্ডিল)</th>
                        <th>স্টক (পিচ)</th>
                        <th>গড় ওজন (কেজি)</th>
                        <th>মোট ওজন (কেজি)</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportRows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">মোট</td>
                        <td>${totalBundles}</td>
                        <td>${totalPieces}</td>
                        <td>-</td>
                        <td>${totalWeight.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <h4>স্টক তথ্য:</h4>
                <p>১. এই রিপোর্টে দেখানো মোট ওজন (${totalWeight.toFixed(2)} কেজি) কাচামাল স্টক থেকে বিয়োগ করা হয়েছে।</p>
                <p>২. প্রতিটি বান্ডিলের সঠিক ওজন ইনপুট দেওয়া হয়েছে।</p>
                <p>৩. বান্ডিল ওজন সংরক্ষণ করার সময় স্বয়ংক্রিয়ভাবে কাচামাল স্টক হালনাগাদ করা হয়েছে।</p>
            </div>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>পণ্য স্টক রিপোর্ট</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                tfoot tr { font-weight: bold; background-color: #f8f9fa; }
                .salary-sheet { border: 1px solid #ddd; padding: 20px; }
                .salary-header { text-align: center; margin-bottom: 20px; }
                .salary-header h3 { font-size: 24px; margin-bottom: 10px; }
                .salary-header p { margin: 5px 0; }
                .statement-summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                .statement-summary-item { text-align: center; }
                .statement-summary-label { font-size: 14px; color: #666; }
                .statement-summary-value { font-size: 18px; font-weight: bold; color: #2c3e50; }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// ৬. উৎপাদন ব্যবস্থাপনা উন্নয়ন
// ============================================

// দ্রুত উৎপাদন এন্ট্রি টেবিল রিফ্রেশ - শুধুমাত্র প্রডাকশন ভিত্তিক শ্রমিকদের দেখাবে
function refreshQuickProductionTable() {
    const table = document.getElementById('quick-production-table');
    table.innerHTML = '';
    
    // শুধুমাত্র প্রডাকশন ভিত্তিক বেতনের শ্রমিকদের ফিল্টার করুন
    const productionWorkers = workers.filter(worker => worker.salaryType === 'প্রডাকশন ভিত্তিক');
    
    if (productionWorkers.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center;">কোন প্রডাকশন ভিত্তিক শ্রমিক পাওয়া যায়নি</td></tr>';
        return;
    }
    
    productionWorkers.forEach(worker => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${worker.id}</td>
            <td>${worker.name}</td>
            <td>${worker.category}</td>
            <td>
                <select class="production-product">
                    <option value="">পণ্য নির্বাচন করুন</option>
                    ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="production-quantity" min="0" step="1" value="0">
            </td>
        `;
        table.appendChild(row);
    });
}

// দ্রুত উৎপাদন সেভ করুন - উন্নত সংস্করণ
function saveQuickProduction() {
    const date = document.getElementById('quick-production-date').value;
    
    if (!date) {
        alert('তারিখ নির্বাচন করুন!');
        return;
    }
    
    let productionSaved = false;
    let lastProductId = null;
    
    document.querySelectorAll('#quick-production-table tr').forEach(row => {
        const workerId = row.cells[0].textContent;
        const productSelect = row.querySelector('.production-product');
        const quantityInput = row.querySelector('.production-quantity');
        
        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);
        
        if (productId && quantity > 0) {
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // সর্বশেষ উৎপাদিত পণ্য আইডি সেভ করুন
                lastProductId = productId;
                
                // উৎপাদন রেকর্ড যোগ করুন (কাচামাল বিয়োগ বান্ডিল ওজন দেওয়ার পরে হবে)
                const production = {
                    date: date,
                    workerId: workerId,
                    productId: productId,
                    quantity: quantity,
                    rawMaterialUsed: 0 // বান্ডিল ওজন দেওয়ার পরে আপডেট হবে
                };
                
                productions.push(production);
                markDataChanged();
                
                // পণ্য স্টক আপডেট করুন
                product.totalProduced += quantity;
                product.stockPieces += quantity;
                
                // বান্ডিল সংখ্যা গণনা করুন
                const newBundles = Math.floor(product.stockPieces / product.piecesPerBundle);
                product.stockBundles = newBundles;
                product.totalBundles += newBundles;
                
                productionSaved = true;
            }
        }
    });
    
    if (productionSaved) {
        // সর্বশেষ উৎপাদিত পণ্য আইডি গ্লোবাল ভেরিয়েবলে সেভ করুন
        lastProducedProductId = lastProductId;
        
        saveAllData();
        alert('উৎপাদন সফলভাবে সেভ করা হয়েছে!\nবান্ডিল ওজন এন্ট্রি সক্রিয় করা হচ্ছে...');
        refreshProductionTable();
        refreshProductTab();
        updateDashboard();
        
        // স্বয়ংক্রিয়ভাবে বান্ডিল ওজন ট্যাবে স্যুইচ করুন
        setTimeout(() => {
            // উৎপাদন ট্যাব নিশ্চিত করুন
            document.querySelector('[data-tab="production"]').click();
            
            // ১ সেকেন্ড পর বান্ডিল পণ্য সিলেক্ট করুন
            setTimeout(() => {
                if (lastProducedProductId) {
                    const bundleProductSelect = document.getElementById('bundle-product');
                    if (bundleProductSelect) {
                        bundleProductSelect.value = lastProducedProductId;
                        
                        // ইভেন্ট ট্রিগার করুন
                        const event = new Event('change');
                        bundleProductSelect.dispatchEvent(event);
                        
                        // বা সরাসরি ফাংশন কল করুন
                        refreshBundleList();
                        
                        // ফোকাস দিন
                        bundleProductSelect.focus();
                        
                        alert(`বান্ডিল ওজন এন্ট্রি সক্রিয়!\nপণ্য নির্বাচন করা হয়েছে: ${lastProducedProductId}\nওজন ইনপুট দিন।`);
                    }
                }
            }, 1000);
        }, 500);
    } else {
        alert('কোন উৎপাদন ডেটা পাওয়া যায়নি!');
    }
}

function refreshProductionTable() {
    const table = document.getElementById('production-table');
    table.innerHTML = '';
    
    if (productions.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">কোন উৎপাদন ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    productions.forEach((production, index) => {
        const worker = workers.find(w => w.id === production.workerId);
        const product = products.find(p => p.id === production.productId);
        
        if (worker && product) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${production.date}</td>
                <td>${worker.name}</td>
                <td>${product.name}</td>
                <td>${production.quantity}</td>
                <td>${production.rawMaterialUsed.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn-danger" onclick="deleteProduction(${index})">মুছুন</button>
                </td>
            `;
            table.appendChild(row);
        }
    });
}

function deleteProduction(index) {
    if(confirm(`আপনি কি এই উৎপাদন রেকর্ড মুছে ফেলতে চান?`)) {
        const production = productions[index];
        const product = products.find(p => p.id === production.productId);
        
        if (product) {
            product.totalProduced -= production.quantity;
            product.stockPieces -= production.quantity;
            
            // বান্ডিল সংখ্যা পুনরায় গণনা করুন
            const newBundles = Math.floor(product.stockPieces / product.piecesPerBundle);
            product.stockBundles = newBundles;
            product.totalBundles = newBundles;
        }
        
        // উৎপাদন ডিলিট করুন
        productions.splice(index, 1);
        markDataChanged();
        saveAllData();
        alert('উৎপাদন রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!');
        refreshProductionTable();
        refreshProductTab();
        updateDashboard();
    }
}

// ============================================
// বাকি সকল ফাংশন (পূর্বের কোড থেকে)
// ============================================

// শ্রমিক ফর্ম সাবমিট
document.getElementById('worker-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const workerId = document.getElementById('worker-id').value;
    
    // আইডি চেক করুন
    if(workers.find(w => w.id === workerId)) {
        alert('এই আইডি দিয়ে ইতিমধ্যে একজন শ্রমিক রয়েছে!');
        return;
    }
    
    const worker = {
        id: workerId,
        name: document.getElementById('worker-name').value,
        category: document.getElementById('worker-category').value,
        address: document.getElementById('worker-address').value,
        phone: document.getElementById('worker-phone').value,
        salaryType: document.getElementById('salary-type').value,
        salaryAmount: parseFloat(document.getElementById('salary-amount').value)
    };
    
    workers.push(worker);
    markDataChanged();
    saveAllData();
    
    alert('শ্রমিক সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshWorkersTable();
    refreshProductionWorkerList();
    refreshAdvanceWorkerList();
    updateDashboard();
});

// শ্রমিক সম্পাদনা ফর্ম সাবমিট
document.getElementById('edit-worker-form-data').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const workerId = document.getElementById('edit-worker-id').value;
    const workerIndex = workers.findIndex(w => w.id === workerId);
    
    if (workerIndex !== -1) {
        workers[workerIndex].name = document.getElementById('edit-worker-name').value;
        workers[workerIndex].category = document.getElementById('edit-worker-category').value;
        workers[workerIndex].address = document.getElementById('edit-worker-address').value;
        workers[workerIndex].phone = document.getElementById('edit-worker-phone').value;
        workers[workerIndex].salaryType = document.getElementById('edit-salary-type').value;
        workers[workerIndex].salaryAmount = parseFloat(document.getElementById('edit-salary-amount').value);
        
        markDataChanged();
        saveAllData();
        
        alert('শ্রমিক সফলভাবে আপডেট করা হয়েছে!');
        document.getElementById('edit-worker-form').classList.remove('active');
        refreshWorkersTable();
        refreshProductionWorkerList();
        refreshAdvanceWorkerList();
        updateDashboard();
    }
});

// শ্রমিক সম্পাদনা ফাংশন
function editWorker(id) {
    const worker = workers.find(w => w.id === id);
    
    if (worker) {
        document.getElementById('edit-worker-id').value = worker.id;
        document.getElementById('edit-worker-name').value = worker.name;
        document.getElementById('edit-worker-category').value = worker.category;
        document.getElementById('edit-worker-address').value = worker.address;
        document.getElementById('edit-worker-phone').value = worker.phone;
        document.getElementById('edit-salary-type').value = worker.salaryType;
        document.getElementById('edit-salary-amount').value = worker.salaryAmount;
        
        // বেতনের ধরন পরিবর্তন হলে তথ্য আপডেট করুন
        updateSalaryRateInfo('edit');
        
        document.getElementById('edit-worker-form').classList.add('active');
        
        // সম্পাদনা ফর্মে স্ক্রল করুন
        document.getElementById('edit-worker-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// শ্রমিক সম্পাদনা বাতিল করুন
function cancelEditWorker() {
    document.getElementById('edit-worker-form').classList.remove('active');
}

// শ্রমিক মুছুন - উন্নত সংস্করণ
function deleteWorker(id) {
    if(confirm(`আপনি কি শ্রমিক ${id} মুছে ফেলতে চান?`)) {
        // সংশ্লিষ্ট হাজিরা ডেটা মুছুন
        attendance = attendance.filter(a => a.workerId !== id);
        
        // সংশ্লিষ্ট উৎপাদন ডেটা মুছুন
        productions = productions.filter(p => p.workerId !== id);
        
        // সংশ্লিষ্ট বেতন পরিশোধ ডেটা মুছুন
        salaryPayments = salaryPayments.filter(p => p.workerId !== id);
        
        // সংশ্লিষ্ট অগ্রীম বেতন ডেটা মুছুন
        advanceSalaries = advanceSalaries.filter(a => a.workerId !== id);
        
        // শ্রমিক মুছুন
        workers = workers.filter(w => w.id !== id);
        
        markDataChanged();
        saveAllData();
        
        alert('শ্রমিক সফলভাবে মুছে ফেলা হয়েছে!');
        refreshWorkersTable();
        refreshQuickAttendanceTable();
        refreshAttendanceTable();
        refreshQuickProductionTable();
        refreshProductionTable();
        refreshProductionWorkerList();
        refreshAdvanceWorkerList();
        updateDashboard();
    }
}

// বেতনের ধরন পরিবর্তন হলে তথ্য আপডেট করুন
document.getElementById('salary-type').addEventListener('change', function() {
    updateSalaryRateInfo('add');
});

document.getElementById('edit-salary-type').addEventListener('change', function() {
    updateSalaryRateInfo('edit');
});

function updateSalaryRateInfo(type) {
    const salaryType = type === 'add' ? 
        document.getElementById('salary-type').value : 
        document.getElementById('edit-salary-type').value;
    
    const infoElement = type === 'add' ? 
        document.getElementById('salary-rate-info') : 
        document.getElementById('edit-salary-rate-info');
    
    if (salaryType === 'সাপ্তাহিক') {
        infoElement.textContent = 'সাপ্তাহিক বেতন (৳)';
    } else if (salaryType === 'প্রডাকশন ভিত্তিক') {
        infoElement.textContent = 'প্রতি পণ্যের হার (৳)';
    } else {
        infoElement.textContent = 'বেতনের হার সাপ্তাহিক বা প্রতি পণ্য ভিত্তিক হবে';
    }
}

// সাপ্লায়ার ফর্ম সাবমিট
document.getElementById('supplier-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const supplierId = document.getElementById('supplier-id').value;
    
    // আইডি চেক করুন
    if(suppliers.find(s => s.id === supplierId)) {
        alert('এই আইডি দিয়ে ইতিমধ্যে একজন সাপ্লায়ার রয়েছে!');
        return;
    }
    
    const supplier = {
        id: supplierId,
        name: document.getElementById('supplier-name').value,
        address: document.getElementById('supplier-address').value,
        phone: document.getElementById('supplier-phone').value,
        materials: Array.from(document.getElementById('supplier-materials').selectedOptions).map(option => option.value)
    };
    
    suppliers.push(supplier);
    markDataChanged();
    saveAllData();
    
    alert('সাপ্লায়ার সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshSuppliersTable();
    refreshMaterialSupplierList();
    refreshTransactionSupplierList();
    refreshSupplierPaymentList();
    updateDashboard();
});

// সাপ্লায়ার সম্পাদনা ফর্ম সাবমিট
document.getElementById('edit-supplier-form-data').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const supplierId = document.getElementById('edit-supplier-id').value;
    const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
    
    if (supplierIndex !== -1) {
        suppliers[supplierIndex].name = document.getElementById('edit-supplier-name').value;
        suppliers[supplierIndex].address = document.getElementById('edit-supplier-address').value;
        suppliers[supplierIndex].phone = document.getElementById('edit-supplier-phone').value;
        suppliers[supplierIndex].materials = Array.from(document.getElementById('edit-supplier-materials').selectedOptions).map(option => option.value);
        
        markDataChanged();
        saveAllData();
        
        alert('সাপ্লায়ার সফলভাবে আপডেট করা হয়েছে!');
        document.getElementById('edit-supplier-form').classList.remove('active');
        refreshSuppliersTable();
        refreshMaterialSupplierList();
        refreshTransactionSupplierList();
        refreshSupplierPaymentList();
        updateDashboard();
    }
});

// সাপ্লায়ার সম্পাদনা ফাংশন
function editSupplier(id) {
    const supplier = suppliers.find(s => s.id === id);
    
    if (supplier) {
        document.getElementById('edit-supplier-id').value = supplier.id;
        document.getElementById('edit-supplier-name').value = supplier.name;
        document.getElementById('edit-supplier-address').value = supplier.address;
        document.getElementById('edit-supplier-phone').value = supplier.phone;
        
        // নির্বাচিত সামগ্রী সেট করুন
        const materialsSelect = document.getElementById('edit-supplier-materials');
        Array.from(materialsSelect.options).forEach(option => {
            option.selected = supplier.materials.includes(option.value);
        });
        
        document.getElementById('edit-supplier-form').classList.add('active');
        
        // সম্পাদনা ফর্মে স্ক্রল করুন
        document.getElementById('edit-supplier-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// সাপ্লায়ার সম্পাদনা বাতিল করুন
function cancelEditSupplier() {
    document.getElementById('edit-supplier-form').classList.remove('active');
}

// সাপ্লায়ার মুছুন - উন্নত সংস্করণ
function deleteSupplier(id) {
    if(confirm(`আপনি কি সাপ্লায়ার ${id} মুছে ফেলতে চান?`)) {
        // সংশ্লিষ্ট কাচামাল ক্রয় ডেটা মুছুন
        rawMaterials = rawMaterials.filter(m => m.supplierId !== id);
        
        // সংশ্লিষ্ট সাপ্লায়ার পেমেন্ট ডেটা মুছুন
        supplierPayments = supplierPayments.filter(p => p.supplierId !== id);
        
        // সাপ্লায়ার মুছুন
        suppliers = suppliers.filter(s => s.id !== id);
        
        markDataChanged();
        saveAllData();
        
        alert('সাপ্লায়ার সফলভাবে মুছে ফেলা হয়েছে!');
        refreshSuppliersTable();
        refreshMaterialSupplierList();
        refreshTransactionSupplierList();
        refreshSupplierPaymentList();
        updateDashboard();
    }
}

// পণ্য ফর্ম সাবমিট
document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    
    // আইডি চেক করুন
    if(products.find(p => p.id === productId)) {
        alert('এই আইডি দিয়ে ইতিমধ্যে একটি পণ্য রয়েছে!');
        return;
    }
    
    const product = {
        id: productId,
        name: document.getElementById('product-name').value,
        piecesPerBundle: parseInt(document.getElementById('pieces-per-bundle').value),
        totalProduced: 0,
        totalBundles: 0,
        stockBundles: 0,
        stockPieces: 0,
        bundleWeights: [] // প্রতিটি বান্ডিলের ওজন সংরক্ষণ
    };
    
    products.push(product);
    markDataChanged();
    saveAllData();
    
    alert('পণ্য সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshProductTab();
    updateDashboard();
});

// উৎপাদন এন্ট্রি ফর্ম সাবমিট
document.getElementById('production-entry-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('production-date').value;
    const workerId = document.getElementById('production-worker').value;
    const productId = document.getElementById('production-product').value;
    const quantity = parseInt(document.getElementById('production-quantity').value);
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('পণ্য পাওয়া যায়নি!');
        return;
    }
    
    // শ্রমিকের বেতনের ধরন চেক করুন
    const worker = workers.find(w => w.id === workerId);
    if (!worker || worker.salaryType !== 'প্রডাকশন ভিত্তিক') {
        alert('শুধুমাত্র প্রডাকশন ভিত্তিক বেতনের শ্রমিক নির্বাচন করুন!');
        return;
    }
    
    // উৎপাদন রেকর্ড যোগ করুন
    const production = {
        date: date,
        workerId: workerId,
        productId: productId,
        quantity: quantity,
        rawMaterialUsed: 0 // বান্ডিল ওজন দেওয়ার পরে আপডেট হবে
    };
    
    productions.push(production);
    markDataChanged();
    
    // পণ্য স্টক আপডেট করুন
    product.totalProduced += quantity;
    product.stockPieces += quantity;
    
    // বান্ডিল সংখ্যা গণনা করুন
    const newBundles = Math.floor(product.stockPieces / product.piecesPerBundle);
    product.stockBundles = newBundles;
    product.totalBundles += newBundles;
    
    // সর্বশেষ উৎপাদিত পণ্য আইডি সেভ করুন
    lastProducedProductId = productId;
    
    saveAllData();
    
    alert('উৎপাদন সফলভাবে যোগ করা হয়েছে!\nবান্ডিল ওজন এন্ট্রি সক্রিয় করা হচ্ছে...');
    this.reset();
    refreshProductTab();
    updateDashboard();
    
    // স্বয়ংক্রিয়ভাবে উৎপাদন ট্যাবে স্যুইচ করুন
    setTimeout(() => {
        document.querySelector('[data-tab="production"]').click();
        
        // ১ সেকেন্ড পর বান্ডিল পণ্য সিলেক্ট করুন
        setTimeout(() => {
            if (lastProducedProductId) {
                const bundleProductSelect = document.getElementById('bundle-product');
                if (bundleProductSelect) {
                    bundleProductSelect.value = lastProducedProductId;
                    refreshBundleList();
                    
                    // বান্ডিল ফর্মে স্ক্রল করুন
                    document.getElementById('bundle-weight-form').scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    alert(`বান্ডিল ওজন এন্ট্রি সক্রিয়!\nপণ্য নির্বাচন করা হয়েছে: ${lastProducedProductId}\nওজন ইনপুট দিন।`);
                }
            }
        }, 1000);
    }, 500);
});

// পণ্য সম্পাদনা ফাংশন
function editProduct(id) {
    const product = products.find(p => p.id === id);
    
    if (product) {
        // সম্পাদনা ফর্ম তৈরি করুন
        const editForm = `
            <div class="edit-worker-form active" id="edit-product-form">
                <h3>পণ্য সম্পাদনা করুন</h3>
                <form id="edit-product-form-data">
                    <input type="hidden" id="edit-product-id" value="${product.id}">
                    <div class="form-group">
                        <label for="edit-product-name">পণ্যের নাম</label>
                        <input type="text" id="edit-product-name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-pieces-per-bundle">প্রতি বান্ডিলে পণ্য সংখ্যা</label>
                        <input type="number" id="edit-pieces-per-bundle" value="${product.piecesPerBundle}" required min="1">
                    </div>
                    <button type="submit" class="btn-success">আপডেট করুন</button>
                    <button type="button" class="btn-warning" onclick="cancelEditProduct()">বাতিল করুন</button>
                </form>
            </div>
        `;
        
        // বিদ্যমান সম্পাদনা ফর্ম মুছে নতুন যোগ করুন
        const existingForm = document.getElementById('edit-product-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        document.getElementById('products').insertAdjacentHTML('beforeend', editForm);
        
        // ফর্ম সাবমিট ইভেন্ট যোগ করুন
        document.getElementById('edit-product-form-data').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const productId = document.getElementById('edit-product-id').value;
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex !== -1) {
                products[productIndex].name = document.getElementById('edit-product-name').value;
                products[productIndex].piecesPerBundle = parseInt(document.getElementById('edit-pieces-per-bundle').value);
                
                markDataChanged();
                saveAllData();
                
                alert('পণ্য সফলভাবে আপডেট করা হয়েছে!');
                document.getElementById('edit-product-form').remove();
                refreshProductTab();
            }
        });
        
        // সম্পাদনা ফর্মে স্ক্রল করুন
        document.getElementById('edit-product-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// পণ্য সম্পাদনা বাতিল করুন
function cancelEditProduct() {
    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
        editForm.remove();
    }
}

// পণ্য মুছুন - উন্নত সংস্করণ
function deleteProduct(id) {
    if(confirm(`আপনি কি পণ্য ${id} মুছে ফেলতে চান?`)) {
        // সংশ্লিষ্ট উৎপাদন ডেটা মুছুন
        productions = productions.filter(p => p.productId !== id);
        
        // সংশ্লিষ্ট বিক্রয় ডেটা মুছুন
        sales = sales.filter(s => s.productId !== id);
        
        // পণ্য মুছুন
        products = products.filter(p => p.id !== id);
        
        markDataChanged();
        saveAllData();
        
        alert('পণ্য সফলভাবে মুছে ফেলা হয়েছে!');
        refreshProductTab();
        updateDashboard();
    }
}

// ক্রেতা ফর্ম সাবমিট
document.getElementById('customer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('customer-id').value;
    
    // আইডি চেক করুন
    if(customers.find(c => c.id === customerId)) {
        alert('এই আইডি দিয়ে ইতিমধ্যে একজন ক্রেতা রয়েছে!');
        return;
    }
    
    const customer = {
        id: customerId,
        name: document.getElementById('customer-name').value,
        address: document.getElementById('customer-address').value,
        phone: document.getElementById('customer-phone').value,
        totalPurchase: 0,
        due: 0
    };
    
    customers.push(customer);
    markDataChanged();
    saveAllData();
    
    alert('ক্রেতা সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshCustomersTable();
    refreshSaleCustomerList();
    refreshTransactionCustomerList();
    refreshCustomerReceiptList();
    updateDashboard();
});

// ক্রেতা সম্পাদনা ফর্ম সাবমিট
document.getElementById('edit-customer-form-data').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('edit-customer-id').value;
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex !== -1) {
        customers[customerIndex].name = document.getElementById('edit-customer-name').value;
        customers[customerIndex].address = document.getElementById('edit-customer-address').value;
        customers[customerIndex].phone = document.getElementById('edit-customer-phone').value;
        
        markDataChanged();
        saveAllData();
        
        alert('ক্রেতা সফলভাবে আপডেট করা হয়েছে!');
        document.getElementById('edit-customer-form').classList.remove('active');
        refreshCustomersTable();
        refreshSaleCustomerList();
        refreshTransactionCustomerList();
        refreshCustomerReceiptList();
        updateDashboard();
    }
});

// ক্রেতা সম্পাদনা ফাংশন
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    
    if (customer) {
        document.getElementById('edit-customer-id').value = customer.id;
        document.getElementById('edit-customer-name').value = customer.name;
        document.getElementById('edit-customer-address').value = customer.address;
        document.getElementById('edit-customer-phone').value = customer.phone;
        
        document.getElementById('edit-customer-form').classList.add('active');
        
        // সম্পাদনা ফর্মে স্ক্রল করুন
        document.getElementById('edit-customer-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// ক্রেতা সম্পাদনা বাতিল করুন
function cancelEditCustomer() {
    document.getElementById('edit-customer-form').classList.remove('active');
}

// ক্রেতা মুছুন - উন্নত সংস্করণ
function deleteCustomer(id) {
    if(confirm(`আপনি কি ক্রেতা ${id} মুছে ফেলতে চান?`)) {
        // সংশ্লিষ্ট বিক্রয় ডেটা মুছুন
        sales = sales.filter(s => s.customerId !== id);
        
        // সংশ্লিষ্ট ক্রেতা রিসিপ্ট ডেটা মুছুন
        customerReceipts = customerReceipts.filter(r => r.customerId !== id);
        
        // ক্রেতা মুছুন
        customers = customers.filter(c => c.id !== id);
        
        markDataChanged();
        saveAllData();
        
        alert('ক্রেতা সফলভাবে মুছে ফেলা হয়েছে!');
        refreshCustomersTable();
        refreshSaleCustomerList();
        refreshTransactionCustomerList();
        refreshCustomerReceiptList();
        updateDashboard();
    }
}

// কাচামাল ফর্ম সাবমিট
document.getElementById('raw-material-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('material-date').value;
    const supplierId = document.getElementById('material-supplier').value;
    const type = document.getElementById('material-type').value;
    const weight = parseFloat(document.getElementById('material-weight').value);
    const price = parseFloat(document.getElementById('material-price').value);
    const paymentMethod = document.querySelector('input[name="material-payment"]:checked').value;
    const bankName = document.getElementById('material-bank-name').value;
    const total = price * weight;
    
    // নগদ পেমেন্টের ক্ষেত্রে নগদ ব্যালেন্স চেক করুন
    if (paymentMethod === 'cash') {
        if (cashBalance < total) {
            alert(`নগদ ব্যালেন্স পর্যাপ্ত নেই! বর্তমান ব্যালেন্স: ৳ ${cashBalance.toFixed(2)}, প্রয়োজন: ৳ ${total.toFixed(2)}`);
            return;
        }
    }
    
    const rawMaterial = {
        date: date,
        supplierId: supplierId,
        type: type,
        weight: weight,
        price: price,
        total: total,
        paymentMethod: paymentMethod,
        bankName: paymentMethod === 'bank' ? bankName : null
    };
    
    rawMaterials.push(rawMaterial);
    markDataChanged();
    
    // কাচামাল স্টক আপডেট করুন
    rawMaterialStock[type] += weight;
    
    // নগদ বা ব্যাংক ব্যালেন্স আপডেট করুন
    if (paymentMethod === 'cash') {
        cashBalance -= total;
    } else if (paymentMethod === 'bank') {
        const bank = banks.find(b => b.name === bankName);
        if (bank) {
            if (bank.balance < total) {
                alert(`ব্যাংক ব্যালেন্স পর্যাপ্ত নেই! ${bankName} ব্যালেন্স: ৳ ${bank.balance.toFixed(2)}, প্রয়োজন: ৳ ${total.toFixed(2)}`);
                rawMaterials.pop(); // রেকর্ড বাতিল করুন
                markDataChanged();
                return;
            }
            bank.balance -= total;
        }
    }
    
    // লেনদেন রেকর্ড যোগ করুন
    if (paymentMethod === 'cash' || paymentMethod === 'bank') {
        const transaction = {
            date: date,
            type: paymentMethod === 'cash' ? 'কাচামাল ক্রয় (নগদ)' : 'কাচামাল ক্রয় (ব্যাংক)',
            amount: total,
            description: `${type} কাচামাল ক্রয় - ${weight} কেজি`
        };
        transactions.push(transaction);
    }
    
    saveAllData();
    
    alert('কাচামাল সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshRawMaterialsTable();
    refreshRawMaterialShelves();
    refreshTransactionsTable();
    updateDashboard();
    refreshBankBalances();
});

// কাচামাল সম্পাদনা ফর্ম সাবমিট
document.getElementById('edit-raw-material-form-data').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('edit-raw-material-index').value);
    const date = document.getElementById('edit-material-date').value;
    const supplierId = document.getElementById('edit-material-supplier').value;
    const type = document.getElementById('edit-material-type').value;
    const weight = parseFloat(document.getElementById('edit-material-weight').value);
    const price = parseFloat(document.getElementById('edit-material-price').value);
    const paymentMethod = document.querySelector('input[name="edit-material-payment"]:checked').value;
    const bankName = document.getElementById('edit-material-bank-name').value;
    const total = price * weight;
    
    if (index >= 0 && index < rawMaterials.length) {
        const oldMaterial = rawMaterials[index];
        const newMaterial = {
            date: date,
            supplierId: supplierId,
            type: type,
            weight: weight,
            price: price,
            total: total,
            paymentMethod: paymentMethod,
            bankName: paymentMethod === 'bank' ? bankName : null
        };
        
        // নগদ পেমেন্টের ক্ষেত্রে নগদ ব্যালেন্স চেক করুন
        if (paymentMethod === 'cash' && cashBalance < total) {
            alert(`নগদ ব্যালেন্স পর্যাপ্ত নেই! বর্তমান ব্যালেন্স: ৳ ${cashBalance.toFixed(2)}, প্রয়োজন: ৳ ${total.toFixed(2)}`);
            return;
        }
        
        // কাচামাল স্টক আপডেট করুন (পুরানো ডেটা বাদ দিন, নতুন ডেটা যোগ করুন)
        rawMaterialStock[oldMaterial.type] -= oldMaterial.weight;
        rawMaterialStock[type] += weight;
        
        // নগদ বা ব্যাংক ব্যালেন্স আপডেট করুন
        if (oldMaterial.paymentMethod === 'cash') {
            cashBalance += oldMaterial.total;
        } else if (oldMaterial.paymentMethod === 'bank') {
            const oldBank = banks.find(b => b.name === oldMaterial.bankName);
            if (oldBank) {
                oldBank.balance += oldMaterial.total;
            }
        }
        
        if (paymentMethod === 'cash') {
            cashBalance -= total;
        } else if (paymentMethod === 'bank') {
            const bank = banks.find(b => b.name === bankName);
            if (bank) {
                if (bank.balance < total) {
                    alert(`ব্যাংক ব্যালেন্স পর্যাপ্ত নেই! ${bankName} ব্যালেন্স: ৳ ${bank.balance.toFixed(2)}, প্রয়োজন: ৳ ${total.toFixed(2)}`);
                    // পূর্বের অবস্থায় ফিরিয়ে আনুন
                    rawMaterialStock[oldMaterial.type] += oldMaterial.weight;
                    rawMaterialStock[type] -= weight;
                    if (oldMaterial.paymentMethod === 'cash') {
                        cashBalance -= oldMaterial.total;
                    } else if (oldMaterial.paymentMethod === 'bank') {
                        const oldBank = banks.find(b => b.name === oldMaterial.bankName);
                        if (oldBank) {
                            oldBank.balance -= oldMaterial.total;
                        }
                    }
                    markDataChanged();
                    return;
                }
                bank.balance -= total;
            }
        }
        
        rawMaterials[index] = newMaterial;
        markDataChanged();
        saveAllData();
        
        alert('কাচামাল সফলভাবে আপডেট করা হয়েছে!');
        document.getElementById('edit-raw-material-form').classList.remove('active');
        refreshRawMaterialsTable();
        refreshRawMaterialShelves();
        updateDashboard();
        refreshBankBalances();
    }
});

// কাচামাল সম্পাদনা ফাংশন
function editRawMaterial(index) {
    const material = rawMaterials[index];
    
    if (material) {
        document.getElementById('edit-raw-material-index').value = index;
        document.getElementById('edit-material-date').value = material.date;
        document.getElementById('edit-material-supplier').value = material.supplierId;
        document.getElementById('edit-material-type').value = material.type;
        document.getElementById('edit-material-weight').value = material.weight;
        document.getElementById('edit-material-price').value = material.price;
        
        // পেমেন্ট পদ্ধতি সেট করুন
        document.querySelectorAll('input[name="edit-material-payment"]').forEach(radio => {
            if (radio.value === material.paymentMethod) {
                radio.checked = true;
            }
        });
        
        // ব্যাংক নির্বাচন সেট করুন
        if (material.paymentMethod === 'bank') {
            document.getElementById('edit-material-bank-select').style.display = 'block';
            document.getElementById('edit-material-bank-name').value = material.bankName;
        } else {
            document.getElementById('edit-material-bank-select').style.display = 'none';
        }
        
        // সম্পাদনা ফর্মের জন্য সাপ্লায়ার তালিকা রিফ্রেশ
        refreshEditMaterialSupplierList();
        
        document.getElementById('edit-raw-material-form').classList.add('active');
        
        // সম্পাদনা ফর্মে স্ক্রল করুন
        document.getElementById('edit-raw-material-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// সম্পাদনা ফর্মের জন্য সাপ্লায়ার তালিকা রিফ্রেশ
function refreshEditMaterialSupplierList() {
    const select = document.getElementById('edit-material-supplier');
    if (select) {
        select.innerHTML = '<option value="">সাপ্লায়ার নির্বাচন করুন</option>';
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = `${supplier.name} (${supplier.id})`;
            select.appendChild(option);
        });
    }
}

// কাচামাল সম্পাদনা বাতিল করুন
function cancelEditRawMaterial() {
    document.getElementById('edit-raw-material-form').classList.remove('active');
}

// স্টক সমন্বয় ফর্ম সাবমিট
document.getElementById('adjustment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('adjustment-date').value;
    const material = document.getElementById('adjustment-material').value;
    const type = document.getElementById('adjustment-type').value;
    const weight = parseFloat(document.getElementById('adjustment-weight').value);
    const reason = document.getElementById('adjustment-reason').value;
    
    const adjustment = {
        date: date,
        material: material,
        type: type,
        weight: weight,
        reason: reason
    };
    
    stockAdjustments.push(adjustment);
    markDataChanged();
    
    // কাচামাল স্টক আপডেট করুন
    if (type === 'যোগ') {
        rawMaterialStock[material] += weight;
    } else if (type === 'বিয়োগ') {
        if (rawMaterialStock[material] < weight) {
            alert('পর্যাপ্ত স্টক নেই!');
            return;
        }
        rawMaterialStock[material] -= weight;
    }
    
    saveAllData();
    
    alert('স্টক সফলভাবে সমন্বয় করা হয়েছে!');
    this.reset();
    refreshStockAdjustmentsTable();
    refreshRawMaterialShelves();
    updateDashboard();
});

// বিক্রয় ফর্ম সাবমিট
document.getElementById('sale-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const saleDate = document.getElementById('sale-date').value;
    const customerId = document.getElementById('sale-customer').value;
    const productId = document.getElementById('sale-product').value;
    const quantity = parseFloat(document.getElementById('sale-quantity').value);
    const price = parseFloat(document.getElementById('sale-price').value);
    const total = parseFloat(document.getElementById('sale-total').value);
    const paymentMethod = document.querySelector('input[name="sale-payment"]:checked').value;
    const bankName = document.getElementById('sale-bank-name').value;
    
    // পণ্য স্টক চেক করুন
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('পণ্য পাওয়া যায়নি!');
        return;
    }
    
    if (product.stockBundles < quantity) {
        alert(`পর্যাপ্ত পণ্য স্টক নেই! উপলব্ধ: ${product.stockBundles.toFixed(2)} বান্ডিল, চাহিদা: ${quantity.toFixed(2)} বান্ডিল`);
        return;
    }
    
    const sale = {
        date: saleDate,
        customerId: customerId,
        productId: productId,
        quantity: quantity,
        price: price,
        total: total,
        paymentMethod: paymentMethod,
        bankName: paymentMethod === 'bank' ? bankName : null
    };
    
    sales.push(sale);
    markDataChanged();
    
    // পণ্য স্টক আপডেট করুন
    product.stockBundles -= quantity;
    product.stockPieces -= quantity * product.piecesPerBundle;
    
    // বান্ডিল ওজন হালনাগাদ করুন (বিক্রিত বান্ডিলের ওজন সরান)
    if (product.bundleWeights.length > 0 && quantity > 0) {
        // প্রথম থেকে বিক্রিত বান্ডিল সংখ্যা পর্যন্ত ওজন সরান
        product.bundleWeights.splice(0, quantity);
    }
    
    // ক্রেতার তথ্য আপডেট করুন
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.totalPurchase += total;
        if (paymentMethod === 'due') {
            customer.due += total;
        }
    }
    
    // নগদ বা ব্যাংক ব্যালেন্স আপডেট করুন
    if (paymentMethod === 'cash') {
        cashBalance += total;
    } else if (paymentMethod === 'bank') {
        const bank = banks.find(b => b.name === bankName);
        if (bank) {
            bank.balance += total;
        }
    }
    
    saveAllData();
    
    alert('বিক্রয় সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshSalesTable();
    refreshProductTab();
    refreshCustomersTable();
    refreshTransactionsTable();
    updateDashboard();
    refreshBankBalances();
});

// ব্যাংক লেনদেন ফর্ম সাবমিট
document.getElementById('bank-transaction-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('bank-transaction-date').value;
    const bankName = document.getElementById('bank-name').value;
    const type = document.getElementById('bank-transaction-type').value;
    const amount = parseFloat(document.getElementById('bank-amount').value);
    const description = document.getElementById('bank-description').value;
    
    const bankTransaction = {
        date: date,
        bankName: bankName,
        type: type,
        amount: amount,
        description: description
    };
    
    bankTransactions.push(bankTransaction);
    markDataChanged();
    
    // ব্যাংক ব্যালেন্স আপডেট করুন
    const bank = banks.find(b => b.name === bankName);
    if (bank) {
        if (type === 'জমা') {
            bank.balance += amount;
            cashBalance -= amount; // নগদ থেকে ব্যাংকে জমা
        } else if (type === 'উত্তোলন') {
            if (bank.balance < amount) {
                alert('পর্যাপ্ত ব্যাংক ব্যালেন্স নেই!');
                return;
            }
            bank.balance -= amount;
            cashBalance += amount; // ব্যাংক থেকে নগদ উত্তোলন
        }
    }
    
    saveAllData();
    
    alert('ব্যাংক লেনদেন সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    refreshBankTransactionsTable();
    refreshBankBalances();
    refreshTransactionsTable();
    updateDashboard();
});

// লেনদেন ফর্ম সাবমিট
document.getElementById('transaction-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('transaction-date').value;
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const supplierId = document.getElementById('transaction-supplier') ? document.getElementById('transaction-supplier').value : null;
    const customerId = document.getElementById('transaction-customer') ? document.getElementById('transaction-customer').value : null;
    
    // নগদ ব্যালেন্স চেক করুন
    if (type === 'বেতন' || type === 'সাপ্লায়ার পেমেন্ট' || type === 'নগদ উত্তোলন') {
        if (cashBalance < amount) {
            alert(`নগদ ব্যালেন্স পর্যাপ্ত নেই! বর্তমান ব্যালেন্স: ৳ ${cashBalance.toFixed(2)}, প্রয়োজন: ৳ ${amount.toFixed(2)}`);
            return;
        }
    }
    
    const transaction = {
        date: date,
        type: type,
        amount: amount,
        description: description,
        supplierId: supplierId,
        customerId: customerId
    };
    
    transactions.push(transaction);
    markDataChanged();
    
    // নগদ ব্যালেন্স আপডেট করুন
    if (type === 'নগদ জমা' || type === 'ক্রেতা পেমেন্ট') {
        cashBalance += amount;
        
        // ক্রেতা পেমেন্ট হলে ক্রেতার বকেয়া হ্রাস করুন
        if (type === 'ক্রেতা পেমেন্ট' && customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customer.due -= amount;
                if (customer.due < 0) customer.due = 0;
            }
        }
    } else if (type === 'নগদ উত্তোলন' || type === 'বেতন' || type === 'সাপ্লায়ার পেমেন্ট') {
        cashBalance -= amount;
    }
    
    saveAllData();
    
    alert('লেনদেন সফলভাবে যোগ করা হয়েছে!');
    this.reset();
    
    // অতিরিক্ত ফিল্ড লুকান
    document.getElementById('supplier-field').style.display = 'none';
    document.getElementById('customer-field').style.display = 'none';
    
    refreshTransactionsTable();
    refreshCustomersTable();
    updateDashboard();
});

// লেনদেন টাইপ পরিবর্তন হলে অতিরিক্ত ফিল্ড দেখান/লুকান
document.getElementById('transaction-type').addEventListener('change', function() {
    const type = this.value;
    const supplierField = document.getElementById('supplier-field');
    const customerField = document.getElementById('customer-field');
    
    // সকল অতিরিক্ত ফিল্ড লুকান
    supplierField.style.display = 'none';
    customerField.style.display = 'none';
    
    // প্রয়োজন অনুসারে ফিল্ড দেখান
    if (type === 'সাপ্লায়ার পেমেন্ট') {
        supplierField.style.display = 'block';
    } else if (type === 'ক্রেতা পেমেন্ট') {
        customerField.style.display = 'block';
    }
});

// লেনদেনের জন্য সাপ্লায়ার তালিকা রিফ্রেশ
function refreshTransactionSupplierList() {
    const select = document.getElementById('transaction-supplier');
    if (select) {
        select.innerHTML = '<option value="">সাপ্লায়ার নির্বাচন করুন</option>';
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = `${supplier.name} (${supplier.id})`;
            select.appendChild(option);
        });
    }
}

// লেনদেনের জন্য ক্রেতা তালিকা রিফ্রেশ
function refreshTransactionCustomerList() {
    const select = document.getElementById('transaction-customer');
    if (select) {
        select.innerHTML = '<option value="">ক্রেতা নির্বাচন করুন</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.id}) - বকেয়া: ৳ ${customer.due.toFixed(2)}`;
            select.appendChild(option);
        });
    }
}

// শ্রমিক তালিকা রিফ্রেশ - বেতন পরিশোধ বাটন সহ
function refreshWorkersTable() {
    const table = document.getElementById('workers-table');
    table.innerHTML = '';
    
    if (workers.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন শ্রমিক ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    workers.forEach(worker => {
        const salaryInfo = worker.salaryType === 'সাপ্তাহিক' ? 
            `৳ ${worker.salaryAmount}/সপ্তাহ` : 
            `৳ ${worker.salaryAmount}/পণ্য`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${worker.id}</td>
            <td>${worker.name}</td>
            <td>${worker.category}</td>
            <td>${worker.phone}</td>
            <td>${worker.salaryType}</td>
            <td>${salaryInfo}</td>
            <td class="action-buttons">
                <button class="salary-payment-btn" onclick="calculateAndPaySalary('${worker.id}')">পরিশোধ</button>
                <button class="advance-salary-btn" onclick="showAdvanceSalaryForm('${worker.id}')">অগ্রীম</button>
                <button class="btn-warning" onclick="editWorker('${worker.id}')">সম্পাদনা</button>
                <button class="btn-danger" onclick="deleteWorker('${worker.id}')">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// শ্রমিকের বেতন গণনা করে পরিশোধ করুন
function calculateAndPaySalary(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
        alert('শ্রমিক পাওয়া যায়নি!');
        return;
    }
    
    const startDate = prompt('বেতনের শুরু তারিখ (YYYY-MM-DD) দিন:', new Date().toISOString().split('T')[0]);
    const endDate = prompt('বেতনের শেষ তারিখ (YYYY-MM-DD) দিন:', new Date().toISOString().split('T')[0]);
    
    if (!startDate || !endDate) {
        alert('তারিখ প্রদান করুন!');
        return;
    }
    
    let salary = 0;
    
    if (worker.salaryType === 'সাপ্তাহিক') {
        // হাজিরা ভিত্তিক বেতন গণনা
        const workerAttendance = attendance.filter(a => 
            a.workerId === worker.id && 
            a.date >= startDate && 
            a.date <= endDate
        );
        
        const presentDays = workerAttendance.filter(a => a.status === 'present').length;
        salary = (presentDays / 6) * worker.salaryAmount;
    } else if (worker.salaryType === 'প্রডাকশন ভিত্তিক') {
        // উৎপাদন ভিত্তিক বেতন গণনা
        const workerProductions = productions.filter(p => 
            p.workerId === worker.id && 
            p.date >= startDate && 
            p.date <= endDate
        );
        
        workerProductions.forEach(production => {
            salary += production.quantity * worker.salaryAmount;
        });
    }
    
    // অগ্রীম বেতন সমন্বয় করুন
    const adjustment = adjustAdvanceSalary(workerId, salary, startDate, endDate);
    salary = adjustment.finalSalary;
    
    if (salary <= 0) {
        alert('পরিশোধযোগ্য বেতন নেই!');
        return;
    }
    
    if (confirm(`${worker.name} (${worker.id}) এর বেতন পরিশোধ করুন? পরিমাণ: ৳ ${salary.toFixed(2)}`)) {
        // বাটন ক্লিক ইভেন্ট পাস করুন
        const event = { target: document.querySelector(`button[onclick*="${workerId}"]`) };
        paySalary(workerId, salary, event);
    }
}

// অগ্রীম বেতন ফর্ম দেখান
function showAdvanceSalaryForm(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    document.getElementById('advance-worker-id').value = workerId;
    document.getElementById('advance-amount').focus();
    
    // অগ্রীম বেতন ফর্মে স্ক্রল করুন
    document.getElementById('advance-salary-form').scrollIntoView({ behavior: 'smooth' });
}

// সাপ্লায়ার তালিকা রিফ্রেশ - ব্যাংক পেমেন্ট তথ্য সহ
function refreshSuppliersTable() {
    const table = document.getElementById('suppliers-table');
    table.innerHTML = '';
    
    if (suppliers.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন সাপ্লায়ার ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    suppliers.forEach(supplier => {
        // সাপ্লায়ারের মোট প্রদান গণনা করুন
        const totalPayments = supplierPayments
            .filter(p => p.supplierId === supplier.id)
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier.id}</td>
            <td>${supplier.name}</td>
            <td>${supplier.address}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.materials.join(', ')}</td>
            <td>৳ ${totalPayments.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editSupplier('${supplier.id}')">সম্পাদনা</button>
                <button class="btn-danger" onclick="deleteSupplier('${supplier.id}')">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// পণ্য তালিকা রিফ্রেশ
function refreshProductsTable() {
    const table = document.getElementById('products-table');
    table.innerHTML = '';
    
    if (products.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন পণ্য ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.piecesPerBundle}</td>
            <td>${product.totalProduced}</td>
            <td>${product.totalBundles}</td>
            <td>${product.stockBundles}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editProduct('${product.id}')">সম্পাদনা</button>
                <button class="btn-danger" onclick="deleteProduct('${product.id}')">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// ক্রেতা তালিকা রিফ্রেশ
function refreshCustomersTable() {
    const table = document.getElementById('customers-table');
    table.innerHTML = '';
    
    if (customers.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন ক্রেতা ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.address}</td>
            <td>${customer.phone}</td>
            <td>৳ ${customer.totalPurchase.toFixed(2)}</td>
            <td>৳ ${customer.due.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editCustomer('${customer.id}')">সম্পাদনা</button>
                <button class="btn-danger" onclick="deleteCustomer('${customer.id}')">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// কাচামাল তালিকা রিফ্রেশ
function refreshRawMaterialsTable() {
    const table = document.getElementById('raw-materials-table');
    table.innerHTML = '';
    
    if (rawMaterials.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন কাচামাল ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    rawMaterials.forEach((material, index) => {
        const supplier = suppliers.find(s => s.id === material.supplierId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${material.date}</td>
            <td>${supplier ? supplier.name : material.supplierId}</td>
            <td>${material.type}</td>
            <td>${material.weight.toFixed(2)}</td>
            <td>৳ ${material.total.toFixed(2)}</td>
            <td>${material.paymentMethod}</td>
            <td class="action-buttons">
                <button class="btn-warning" onclick="editRawMaterial(${index})">সম্পাদনা</button>
                <button class="btn-danger" onclick="deleteRawMaterial(${index})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// স্টক সমন্বয় তালিকা রিফ্রেশ
function refreshStockAdjustmentsTable() {
    const table = document.getElementById('stock-adjustments-table');
    table.innerHTML = '';
    
    if (stockAdjustments.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">কোন স্টক সমন্বয় ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    stockAdjustments.forEach((adjustment, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${adjustment.date}</td>
            <td>${adjustment.material}</td>
            <td>${adjustment.type}</td>
            <td>${adjustment.weight.toFixed(2)}</td>
            <td>${adjustment.reason}</td>
            <td class="action-buttons">
                <button class="btn-danger" onclick="deleteStockAdjustment(${index})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// কাচামাল স্টক তাকিকা রিফ্রেশ
function refreshRawMaterialShelves() {
    // এলুমিনিয়াম স্টক
    document.getElementById('aluminum-stock').textContent = `${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)} কেজি`;
    document.getElementById('detail-aluminum').textContent = `${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)} কেজি`;
    
    // এলুমিনিয়াম গড় মূল্য
    const aluminumMaterials = rawMaterials.filter(m => m.type === 'এলুমিনিয়াম');
    const aluminumAvgPrice = aluminumMaterials.length > 0 ? 
        aluminumMaterials.reduce((total, material) => total + material.price, 0) / aluminumMaterials.length : 0;
    document.getElementById('aluminum-avg-price').textContent = `৳ ${aluminumAvgPrice.toFixed(2)}`;
    
    // এলুমিনিয়াম স্টক অবস্থা
    const aluminumStatus = document.getElementById('aluminum-status');
    if (rawMaterialStock['এলুমিনিয়াম'] < 100) {
        aluminumStatus.textContent = 'নিম্ন';
        aluminumStatus.className = 'stock-level low-stock';
    } else if (rawMaterialStock['এলুমিনিয়াম'] < 500) {
        aluminumStatus.textContent = 'মধ্যম';
        aluminumStatus.className = 'stock-level medium-stock';
    } else {
        aluminumStatus.textContent = 'পর্যাপ্ত';
        aluminumStatus.className = 'stock-level high-stock';
    }
    
    // স্টিল স্টক
    document.getElementById('steel-stock').textContent = `${rawMaterialStock['স্টিল'].toFixed(2)} কেজি`;
    document.getElementById('detail-steel').textContent = `${rawMaterialStock['স্টিল'].toFixed(2)} কেজি`;
    
    // স্টিল গড় মূল্য
    const steelMaterials = rawMaterials.filter(m => m.type === 'স্টিল');
    const steelAvgPrice = steelMaterials.length > 0 ? 
        steelMaterials.reduce((total, material) => total + material.price, 0) / steelMaterials.length : 0;
    document.getElementById('steel-avg-price').textContent = `৳ ${steelAvgPrice.toFixed(2)}`;
    
    // স্টিল স্টক অবস্থা
    const steelStatus = document.getElementById('steel-status');
    if (rawMaterialStock['স্টিল'] < 50) {
        steelStatus.textContent = 'নিম্ন';
        steelStatus.className = 'stock-level low-stock';
    } else if (rawMaterialStock['স্টিল'] < 200) {
        steelStatus.textContent = 'মধ্যম';
        steelStatus.className = 'stock-level medium-stock';
    } else {
        steelStatus.textContent = 'পর্যাপ্ত';
        steelStatus.className = 'stock-level high-stock';
    }
    
    // তামা স্টক
    document.getElementById('copper-stock').textContent = `${rawMaterialStock['তামা'].toFixed(2)} কেজি`;
    document.getElementById('detail-copper').textContent = `${rawMaterialStock['তামা'].toFixed(2)} কেজি`;
    
    // তামা গড় মূল্য
    const copperMaterials = rawMaterials.filter(m => m.type === 'তামা');
    const copperAvgPrice = copperMaterials.length > 0 ? 
        copperMaterials.reduce((total, material) => total + material.price, 0) / copperMaterials.length : 0;
    document.getElementById('copper-avg-price').textContent = `৳ ${copperAvgPrice.toFixed(2)}`;
    
    // তামা স্টক অবস্থা
    const copperStatus = document.getElementById('copper-status');
    if (rawMaterialStock['তামা'] < 20) {
        copperStatus.textContent = 'নিম্ন';
        copperStatus.className = 'stock-level low-stock';
    } else if (rawMaterialStock['তামা'] < 100) {
        copperStatus.textContent = 'মধ্যম';
        copperStatus.className = 'stock-level medium-stock';
    } else {
        copperStatus.textContent = 'পর্যাপ্ত';
        copperStatus.className = 'stock-level high-stock';
    }
    
    // মোট স্টক
    const totalStock = rawMaterialStock['এলুমিনিয়াম'] + rawMaterialStock['স্টিল'] + rawMaterialStock['তামা'];
    document.getElementById('detail-total').textContent = `${totalStock.toFixed(2)} কেজি`;
}

// বিক্রয় তালিকা রিফ্রেশ
function refreshSalesTable() {
    const table = document.getElementById('sales-table');
    table.innerHTML = '';
    
    if (sales.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">কোন বিক্রয় ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    sales.forEach((sale, index) => {
        const customer = customers.find(c => c.id === sale.customerId);
        const product = products.find(p => p.id === sale.productId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${customer ? customer.name : sale.customerId}</td>
            <td>${product ? product.name : sale.productId}</td>
            <td>${sale.quantity.toFixed(2)}</td>
            <td>৳ ${sale.total.toFixed(2)}</td>
            <td>${sale.paymentMethod}</td>
            <td class="action-buttons">
                <button class="btn-danger" onclick="deleteSale(${index})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// ব্যাংক লেনদেন তালিকা রিফ্রেশ
function refreshBankTransactionsTable() {
    const table = document.getElementById('bank-transactions-table');
    table.innerHTML = '';
    
    if (bankTransactions.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">কোন ব্যাংক লেনদেন ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    bankTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.bankName}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>৳ ${transaction.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn-danger" onclick="deleteBankTransaction(${index})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// লেনদেন তালিকা রিফ্রেশ
function refreshTransactionsTable() {
    const table = document.getElementById('transactions-table');
    table.innerHTML = '';
    
    if (transactions.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center;">কোন লেনদেন ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>৳ ${transaction.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn-danger" onclick="deleteTransaction(${index})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// ব্যাংক ব্যালেন্স রিফ্রেশ
function refreshBankBalances() {
    const sonaliBank = banks.find(b => b.name === document.getElementById('sonali-bank-name').textContent);
    const janataBank = banks.find(b => b.name === document.getElementById('janata-bank-name').textContent);
    const rupaliBank = banks.find(b => b.name === document.getElementById('rupali-bank-name').textContent);
    
    if (sonaliBank) {
        document.getElementById('sonali-balance').textContent = `৳ ${sonaliBank.balance.toFixed(2)}`;
    }
    if (janataBank) {
        document.getElementById('janata-balance').textContent = `৳ ${janataBank.balance.toFixed(2)}`;
    }
    if (rupaliBank) {
        document.getElementById('rupali-balance').textContent = `৳ ${rupaliBank.balance.toFixed(2)}`;
    }
    
    // মোট ব্যাংক ব্যালেন্স আপডেট করুন
    const totalBankBalance = banks.reduce((total, bank) => total + bank.balance, 0);
    document.getElementById('bank-balance').textContent = `৳ ${totalBankBalance.toFixed(2)}`;
}

// ব্যাংক সিলেক্ট তালিকা রিফ্রেশ
function refreshBankSelects() {
    const bankSelects = [
        document.getElementById('bank-name'),
        document.getElementById('material-bank-name'),
        document.getElementById('sale-bank-name'),
        document.getElementById('edit-material-bank-name'),
        document.getElementById('supplier-payment-bank'),
        document.getElementById('customer-receipt-bank')
    ];
    
    bankSelects.forEach(select => {
        if (select) {
            select.innerHTML = '';
            banks.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.name;
                option.textContent = bank.name;
                select.appendChild(option);
            });
        }
    });
}

// স্টেটমেন্ট ব্যাংক তালিকা রিফ্রেশ
function refreshStatementBankList() {
    const select = document.getElementById('statement-bank');
    select.innerHTML = '<option value="all">সকল ব্যাংক</option>';
    
    banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank.name;
        option.textContent = bank.name;
        select.appendChild(option);
    });
}

// ব্যাংকের নাম আপডেট করুন
function updateBankName(bankType) {
    const inputId = `${bankType}-bank-edit`;
    const nameId = `${bankType}-bank-name`;
    const newName = document.getElementById(inputId).value;
    
    if (!newName.trim()) {
        alert('ব্যাংকের নাম খালি রাখা যাবে না!');
        return;
    }
    
    // পুরানো নাম খুঁজে বের করুন
    const oldName = document.getElementById(nameId).textContent;
    
    // ব্যাংক অবজেক্ট আপডেট করুন
    const bank = banks.find(b => b.name === oldName);
    if (bank) {
        bank.name = newName;
        markDataChanged();
    }
    
    // ব্যাংক লেনদেন আপডেট করুন
    bankTransactions.forEach(transaction => {
        if (transaction.bankName === oldName) {
            transaction.bankName = newName;
        }
    });
    
    // বিক্রয় আপডেট করুন
    sales.forEach(sale => {
        if (sale.bankName === oldName) {
            sale.bankName = newName;
        }
    });
    
    // কাচামাল আপডেট করুন
    rawMaterials.forEach(material => {
        if (material.bankName === oldName) {
            material.bankName = newName;
        }
    });
    
    // সাপ্লায়ার পেমেন্ট আপডেট করুন
    supplierPayments.forEach(payment => {
        if (payment.bankName === oldName) {
            payment.bankName = newName;
        }
    });
    
    // ক্রেতা রিসিপ্ট আপডেট করুন
    customerReceipts.forEach(receipt => {
        if (receipt.bankName === oldName) {
            receipt.bankName = newName;
        }
    });
    
    saveAllData();
    
    // UI আপডেট করুন
    document.getElementById(nameId).textContent = newName;
    refreshBankSelects();
    refreshStatementBankList();
    refreshBankBalances();
    
    alert('ব্যাংকের নাম সফলভাবে আপডেট করা হয়েছে!');
}

// ব্যাংক স্টেটমেন্ট জেনারেট করুন
function generateBankStatement() {
    const bankName = document.getElementById('statement-bank').value;
    const startDate = document.getElementById('statement-start-date').value;
    const endDate = document.getElementById('statement-end-date').value;
    
    let filteredTransactions = bankTransactions;
    
    // ব্যাংক দ্বারা ফিল্টার করুন
    if (bankName !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.bankName === bankName);
    }
    
    // তারিখ দ্বারা ফিল্টার করুন
    if (startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
    }
    
    if (endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
    }
    
    // তারিখ অনুসারে সাজান
    filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const table = document.getElementById('bank-statement-table');
    table.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        table.innerHTML = '<tr><td colspan="7" class="no-data">কোন লেনদেন ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    // ব্যাংক ব্যালেন্স ট্র্যাক রাখুন
    let runningBalance = 0;
    
    // নির্দিষ্ট ব্যাংকের জন্য প্রারম্ভিক ব্যালেন্স সেট করুন
    if (bankName !== 'all') {
        const bank = banks.find(b => b.name === bankName);
        if (bank) {
            runningBalance = bank.balance;
            
            // লেনদেন বিপরীত ক্রমে ব্যালেন্স গণনা করুন
            for (let i = filteredTransactions.length - 1; i >= 0; i--) {
                const transaction = filteredTransactions[i];
                if (transaction.type === 'জমা') {
                    runningBalance -= transaction.amount;
                } else if (transaction.type === 'উত্তোলন') {
                    runningBalance += transaction.amount;
                }
            }
        }
    } else {
        // সকল ব্যাংকের জন্য প্রারম্ভিক ব্যালেন্স গণনা করুন
        runningBalance = banks.reduce((total, bank) => total + bank.balance, 0);
        
        // লেনদেন বিপরীত ক্রমে ব্যালেন্স গণনা করুন
        for (let i = filteredTransactions.length - 1; i >= 0; i--) {
            const transaction = filteredTransactions[i];
            if (transaction.type === 'জমা') {
                runningBalance -= transaction.amount;
            } else if (transaction.type === 'উত্তোলন') {
                runningBalance += transaction.amount;
            }
        }
    }
    
    // টেবিলে লেনদেন যোগ করুন
    filteredTransactions.forEach(transaction => {
        const deposit = transaction.type === 'জমা' ? transaction.amount : 0;
        const withdrawal = transaction.type === 'উত্তোলন' ? transaction.amount : 0;
        
        if (transaction.type === 'জমা') {
            runningBalance += transaction.amount;
        } else if (transaction.type === 'উত্তোলন') {
            runningBalance -= transaction.amount;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.bankName}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>${deposit > 0 ? '৳ ' + deposit.toFixed(2) : ''}</td>
            <td>${withdrawal > 0 ? '৳ ' + withdrawal.toFixed(2) : ''}</td>
            <td>৳ ${runningBalance.toFixed(2)}</td>
        `;
        table.appendChild(row);
    });
}

// ড্যাশবোর্ড আপডেট করুন
function updateDashboard() {
    // মোট শ্রমিক
    document.getElementById('total-workers').textContent = workers.length;
    
    // বর্তমান মাসের বেতন
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthSalary = calculateCurrentMonthSalary(currentMonth);
    
    // এই মাসে পরিশোধিত বেতন বাদ দিন
    const thisMonthSalaryPayments = salaryPayments.filter(payment => {
        return payment.date.startsWith(currentMonth);
    }).reduce((sum, payment) => sum + payment.amount, 0);
    
    const netCurrentMonthSalary = Math.max(0, currentMonthSalary - thisMonthSalaryPayments);
    
    document.getElementById('current-month-salary').textContent = `৳ ${netCurrentMonthSalary.toFixed(2)}`;
    
    // মোট সাপ্লায়ার
    document.getElementById('total-suppliers').textContent = suppliers.length;
    
    // মোট ক্রেতা
    document.getElementById('total-customers').textContent = customers.length;
    
    // কাচামাল স্টক
    const totalRawMaterial = rawMaterialStock['এলুমিনিয়াম'] + rawMaterialStock['স্টিল'] + rawMaterialStock['তামা'];
    document.getElementById('total-raw-material').textContent = totalRawMaterial.toFixed(2);
    
    // পণ্য স্টক (বান্ডিল)
    const totalProductStock = products.reduce((total, product) => total + product.stockBundles, 0);
    document.getElementById('total-product-stock').textContent = totalProductStock.toFixed(0);
    
    // মোট বিক্রয়
    const totalSales = sales.reduce((total, sale) => total + sale.total, 0);
    document.getElementById('total-sales').textContent = `৳ ${totalSales.toFixed(2)}`;
    
    // মোট বকেয়া
    const totalDue = customers.reduce((total, customer) => total + customer.due, 0);
    document.getElementById('total-due').textContent = `৳ ${totalDue.toFixed(2)}`;
    
    // নগদ ব্যালেন্স
    document.getElementById('cash-balance').textContent = `৳ ${cashBalance.toFixed(2)}`;
    
    // ব্যাংক ব্যালেন্স
    const totalBankBalance = banks.reduce((total, bank) => total + bank.balance, 0);
    document.getElementById('bank-balance').textContent = `৳ ${totalBankBalance.toFixed(2)}`;
    
    // সাম্প্রতিক কার্যক্রম
    refreshRecentActivities();
}

// বর্তমান মাসের বেতন গণনা করুন - সংশোধিত
function calculateCurrentMonthSalary(month) {
    let totalSalary = 0;
    
    // বর্তমান মাসের শুরু এবং শেষ তারিখ নির্ধারণ করুন
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0];
    
    workers.forEach(worker => {
        let workerSalary = 0;
        
        if (worker.salaryType === 'সাপ্তাহিক') {
            // হাজিরা ভিত্তিক বেতন গণনা
            const workerAttendance = attendance.filter(a => 
                a.workerId === worker.id && 
                a.date >= startDate && 
                a.date <= endDate
            );
            
            const presentDays = workerAttendance.filter(a => a.status === 'present').length;
            workerSalary = (presentDays / 6) * worker.salaryAmount; // 6 দিন কাজ ধরে নেওয়া হয়েছে
        } else if (worker.salaryType === 'প্রডাকশন ভিত্তিক') {
            // উৎপাদন ভিত্তিক বেতন গণনা - শুধুমাত্র উৎপাদিত পণ্য সংখ্যা ভিত্তিক
            const workerProductions = productions.filter(p => 
                p.workerId === worker.id && 
                p.date >= startDate && 
                p.date <= endDate
            );
            
            workerProductions.forEach(production => {
                workerSalary += production.quantity * worker.salaryAmount;
            });
        }
        
        // এই মাসে পরিশোধিত বেতন বাদ দিন
        const paidThisMonth = salaryPayments.filter(payment => 
            payment.workerId === worker.id && 
            payment.date >= startDate && 
            payment.date <= endDate
        ).reduce((sum, payment) => sum + payment.amount, 0);
        
        workerSalary = Math.max(0, workerSalary - paidThisMonth);
        
        totalSalary += workerSalary;
    });
    
    return totalSalary;
}

// সাম্প্রতিক কার্যক্রম রিফ্রেশ - সম্পাদনা এবং ডিলেট বাটন সহ
function refreshRecentActivities() {
    const table = document.getElementById('recent-activities-table');
    table.innerHTML = '';
    
    // সমস্ত কার্যক্রম একত্রিত করুন
    let allActivities = [];
    
    // প্রতিটি কার্যক্রমের জন্য একটি ইউনিক আইডি যোগ করুন
    let activityCounter = 0;
    
    // বিক্রয় যোগ করুন
    sales.forEach((sale, index) => {
        const customer = customers.find(c => c.id === sale.customerId);
        allActivities.push({
            id: `sale_${index}`,
            date: sale.date,
            description: `${customer ? customer.name : sale.customerId} এর কাছে বিক্রয়`,
            amount: sale.total,
            type: 'বিক্রয়',
            dataIndex: index,
            dataType: 'sale'
        });
    });
    
    // ব্যাংক লেনদেন যোগ করুন
    bankTransactions.forEach((transaction, index) => {
        allActivities.push({
            id: `bank_${index}`,
            date: transaction.date,
            description: `${transaction.bankName} - ${transaction.description}`,
            amount: transaction.amount,
            type: transaction.type,
            dataIndex: index,
            dataType: 'bank'
        });
    });
    
    // লেনদেন যোগ করুন
    transactions.forEach((transaction, index) => {
        allActivities.push({
            id: `trans_${index}`,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            dataIndex: index,
            dataType: 'transaction'
        });
    });
    
    // বেতন পরিশোধ যোগ করুন
    salaryPayments.forEach((payment, index) => {
        const worker = workers.find(w => w.id === payment.workerId);
        allActivities.push({
            id: `salary_${index}`,
            date: payment.date,
            description: `${worker ? worker.name : payment.workerId} - বেতন পরিশোধ`,
            amount: payment.amount,
            type: 'বেতন',
            dataIndex: index,
            dataType: 'salary'
        });
    });
    
    // সাপ্লায়ার পেমেন্ট যোগ করুন
    supplierPayments.forEach((payment, index) => {
        const supplier = suppliers.find(s => s.id === payment.supplierId);
        allActivities.push({
            id: `supplier_${index}`,
            date: payment.date,
            description: `${supplier ? supplier.name : payment.supplierId} - সাপ্লায়ার পেমেন্ট`,
            amount: payment.amount,
            type: 'সাপ্লায়ার পেমেন্ট',
            dataIndex: index,
            dataType: 'supplier'
        });
    });
    
    // ক্রেতা রিসিপ্ট যোগ করুন
    customerReceipts.forEach((receipt, index) => {
        const customer = customers.find(c => c.id === receipt.customerId);
        allActivities.push({
            id: `customer_${index}`,
            date: receipt.date,
            description: `${customer ? customer.name : receipt.customerId} - টাকা জমা`,
            amount: receipt.amount,
            type: 'ক্রেতা জমা',
            dataIndex: index,
            dataType: 'customer'
        });
    });
    
    // তারিখ অনুসারে সাজান (নতুন থেকে পুরাতন)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // সর্বশেষ 10টি কার্যক্রম দেখান
    const recentActivities = allActivities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center;">কোন সাম্প্রতিক কার্যক্রম পাওয়া যায়নি</td></tr>';
        return;
    }
    
    recentActivities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.date}</td>
            <td>${activity.description}</td>
            <td>৳ ${activity.amount.toFixed(2)}</td>
            <td>${activity.type}</td>
            <td class="action-buttons">
                <button class="btn-warning recent-activity-btn" onclick="editRecentActivity('${activity.dataType}', ${activity.dataIndex})">সম্পাদনা</button>
                <button class="btn-danger recent-activity-btn" onclick="deleteRecentActivity('${activity.dataType}', ${activity.dataIndex})">মুছুন</button>
            </td>
        `;
        table.appendChild(row);
    });
}

// সাম্প্রতিক কার্যক্রম সম্পাদনা করুন
function editRecentActivity(type, index) {
    alert(`"${type}" টাইপের কার্যক্রম আইডি "${index}" সম্পাদনা করুন।\n\nবিঃদ্রঃ সম্পাদনা ফিচারটি উন্নয়নাধীন আছে।`);
}

// সাম্প্রতিক কার্যক্রম মুছে ফেলুন
function deleteRecentActivity(type, index) {
    if(confirm(`আপনি কি এই কার্যক্রম মুছে ফেলতে চান?\n\nধরন: ${type}\nসূচক: ${index}`)) {
        try {
            if (type === 'sale' && index >= 0 && index < sales.length) {
                const sale = sales[index];
                // পণ্য স্টক ফেরত দিন
                const product = products.find(p => p.id === sale.productId);
                if (product) {
                    product.stockBundles += sale.quantity;
                    product.stockPieces += sale.quantity * product.piecesPerBundle;
                }
                
                // ক্রেতার তথ্য আপডেট করুন
                const customer = customers.find(c => c.id === sale.customerId);
                if (customer) {
                    customer.totalPurchase -= sale.total;
                    if (sale.paymentMethod === 'due') {
                        customer.due -= sale.total;
                    }
                }
                
                // নগদ বা ব্যাংক ব্যালেন্স আপডেট করুন
                if (sale.paymentMethod === 'cash') {
                    cashBalance -= sale.total;
                } else if (sale.paymentMethod === 'bank') {
                    const bank = banks.find(b => b.name === sale.bankName);
                    if (bank) {
                        bank.balance -= sale.total;
                    }
                }
                
                sales.splice(index, 1);
            } 
            else if (type === 'transaction' && index >= 0 && index < transactions.length) {
                const transaction = transactions[index];
                
                // নগদ ব্যালেন্স আপডেট করুন
                if (transaction.type === 'নগদ জমা' || transaction.type === 'ক্রেতা পেমেন্ট') {
                    cashBalance -= transaction.amount;
                    
                    // ক্রেতা পেমেন্ট হলে ক্রেতার বকেয়া ফেরত দিন
                    if (transaction.type === 'ক্রেতা পেমেন্ট' && transaction.customerId) {
                        const customer = customers.find(c => c.id === transaction.customerId);
                        if (customer) {
                            customer.due += transaction.amount;
                        }
                    }
                } else if (transaction.type === 'নগদ উত্তোলন' || transaction.type === 'বেতন' || transaction.type === 'সাপ্লায়ার পেমেন্ট') {
                    cashBalance += transaction.amount;
                }
                
                transactions.splice(index, 1);
            }
            else if (type === 'bank' && index >= 0 && index < bankTransactions.length) {
                const transaction = bankTransactions[index];
                
                // ব্যাংক ব্যালেন্স আপডেট করুন
                const bank = banks.find(b => b.name === transaction.bankName);
                if (bank) {
                    if (transaction.type === 'জমা') {
                        bank.balance -= transaction.amount;
                        cashBalance += transaction.amount; // ব্যাংক থেকে নগদ ফেরত
                    } else if (transaction.type === 'উত্তোলন') {
                        bank.balance += transaction.amount;
                        cashBalance -= transaction.amount; // নগদ থেকে ব্যাংক ফেরত
                    }
                }
                
                bankTransactions.splice(index, 1);
            }
            else if (type === 'salary' && index >= 0 && index < salaryPayments.length) {
                const payment = salaryPayments[index];
                
                // নগদ ব্যালেন্স ফেরত দিন
                cashBalance += payment.amount;
                
                // লেনদেন থেকে মুছুন
                const transIndex = transactions.findIndex(t => 
                    t.description.includes(payment.workerId) && 
                    t.amount === payment.amount
                );
                if (transIndex !== -1) {
                    transactions.splice(transIndex, 1);
                }
                
                salaryPayments.splice(index, 1);
            }
            
            markDataChanged();
            saveAllData();
            
            alert('কার্যক্রম সফলভাবে মুছে ফেলা হয়েছে!');
            refreshRecentActivities();
            updateDashboard();
            
        } catch (error) {
            alert('কার্যক্রম মুছতে সমস্যা হয়েছে: ' + error.message);
        }
    }
}

// বিক্রয় ক্রেতা তালিকা রিফ্রেশ
function refreshSaleCustomerList() {
    const select = document.getElementById('sale-customer');
    select.innerHTML = '<option value="">ক্রেতা নির্বাচন করুন</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.id})`;
        select.appendChild(option);
    });
}

// বিক্রয় পণ্য তালিকা রিফ্রেশ
function refreshSaleProductList() {
    const select = document.getElementById('sale-product');
    select.innerHTML = '<option value="">পণ্য নির্বাচন করুন</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (স্টক: ${product.stockBundles} বান্ডিল)`;
        select.appendChild(option);
    });
}

// কাচামাল সাপ্লায়ার তালিকা রিফ্রেশ
function refreshMaterialSupplierList() {
    const select = document.getElementById('material-supplier');
    select.innerHTML = '<option value="">সাপ্লায়ার নির্বাচন করুন</option>';
    
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (${supplier.id})`;
        select.appendChild(option);
    });
}

// বিক্রয় ফর্মে পরিমাণ এবং মূল্য পরিবর্তন হলে মোট মূল্য গণনা
document.getElementById('sale-quantity').addEventListener('input', calculateSaleTotal);
document.getElementById('sale-price').addEventListener('input', calculateSaleTotal);

function calculateSaleTotal() {
    const quantity = parseFloat(document.getElementById('sale-quantity').value) || 0;
    const price = parseFloat(document.getElementById('sale-price').value) || 0;
    const total = quantity * price;
    document.getElementById('sale-total').value = total.toFixed(2);
}

// ব্যাংক পেমেন্ট নির্বাচন করলে ব্যাংক নির্বাচন ফিল্ড দেখান
document.querySelectorAll('input[name="sale-payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const bankSelect = document.getElementById('sale-bank-select');
        if (this.value === 'bank') {
            bankSelect.style.display = 'block';
        } else {
            bankSelect.style.display = 'none';
        }
    });
});

document.querySelectorAll('input[name="material-payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const bankSelect = document.getElementById('material-bank-select');
        if (this.value === 'bank') {
            bankSelect.style.display = 'block';
        } else {
            bankSelect.style.display = 'none';
        }
    });
});

document.querySelectorAll('input[name="edit-material-payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const bankSelect = document.getElementById('edit-material-bank-select');
        if (this.value === 'bank') {
            bankSelect.style.display = 'block';
        } else {
            bankSelect.style.display = 'none';
        }
    });
});

// পণ্য ব্যবস্থাপনা ট্যাব রিফ্রেশ
function refreshProductTab() {
    refreshProductSuggestions();
    refreshProductsTable();
    refreshProductionProductList();
    refreshBundleProductList();
    refreshStockReport();
    refreshProductionWorkerList();
    refreshSaleProductList();
}

// পণ্যের নামের পরামর্শ রিফ্রেশ
function refreshProductSuggestions() {
    const suggestionsContainer = document.getElementById('product-suggestions');
    suggestionsContainer.innerHTML = '';
    
    // কড়াই সিরিজ (কড়াই-0 সহ)
    for (let i = 0; i <= 20; i++) {
        const suggestion = document.createElement('span');
        suggestion.className = 'product-suggestion';
        suggestion.textContent = `কড়াই-${i}`;
        suggestion.onclick = function() {
            document.getElementById('product-name').value = `কড়াই-${i}`;
            // স্বয়ংক্রিয়ভাবে প্রতি বান্ডিলে পণ্য সংখ্যা সেট করুন
            if (i === 0 || i === 1) {
                document.getElementById('pieces-per-bundle').value = 8;
            } else if (i === 10) {
                document.getElementById('pieces-per-bundle').value = 4;
            } else {
                document.getElementById('pieces-per-bundle').value = 6; // ডিফল্ট মান
            }
        };
        suggestionsContainer.appendChild(suggestion);
    }
    
    // তৈ সিরিজ (শুধু তৈ-১ এবং তৈ-২)
    for (let i = 1; i <= 2; i++) {
        const suggestion = document.createElement('span');
        suggestion.className = 'product-suggestion';
        suggestion.textContent = `তৈ-${i}`;
        suggestion.onclick = function() {
            document.getElementById('product-name').value = `তৈ-${i}`;
            document.getElementById('pieces-per-bundle').value = 10; // ডিফল্ট মান
        };
        suggestionsContainer.appendChild(suggestion);
    }
    
    // তাওয়া
    const tawaSuggestion = document.createElement('span');
    tawaSuggestion.className = 'product-suggestion';
    tawaSuggestion.textContent = 'তাওয়া';
    tawaSuggestion.onclick = function() {
        document.getElementById('product-name').value = 'তাওয়া';
        document.getElementById('pieces-per-bundle').value = 12; // ডিফল্ট মান
    };
    suggestionsContainer.appendChild(tawaSuggestion);
}

// উৎপাদন পণ্য তালিকা রিফ্রেশ
function refreshProductionProductList() {
    const select = document.getElementById('production-product');
    select.innerHTML = '<option value="">পণ্য নির্বাচন করুন</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.id})`;
        select.appendChild(option);
    });
}

// বান্ডিল পণ্য তালিকা রিফ্রেশ
function refreshBundleProductList() {
    const select = document.getElementById('bundle-product');
    select.innerHTML = '<option value="">পণ্য নির্বাচন করুন</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.id})`;
        select.appendChild(option);
    });
}

// উৎপাদন শ্রমিক তালিকা রিফ্রেশ - শুধুমাত্র প্রডাকশন ভিত্তিক শ্রমিক
function refreshProductionWorkerList() {
    const select = document.getElementById('production-worker');
    select.innerHTML = '<option value="">শ্রমিক নির্বাচন করুন</option>';
    
    workers.forEach(worker => {
        if (worker.salaryType === 'প্রডাকশন ভিত্তিক') {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = `${worker.name} (${worker.id})`;
            select.appendChild(option);
        }
    });
}

// স্টক বিবরণ দেখান
function showStockDetails() {
    const stockDetails = document.getElementById('stock-details');
    const adjustmentForm = document.getElementById('stock-adjustment-form');
    
    stockDetails.style.display = 'block';
    adjustmentForm.style.display = 'none';
}

// স্টক সমন্বয় ফর্ম দেখান
function showStockAdjustmentForm() {
    const stockDetails = document.getElementById('stock-details');
    const adjustmentForm = document.getElementById('stock-adjustment-form');
    
    stockDetails.style.display = 'none';
    adjustmentForm.style.display = 'block';
}

// স্টক সমন্বয় ফর্ম লুকান
function hideStockAdjustmentForm() {
    const adjustmentForm = document.getElementById('stock-adjustment-form');
    adjustmentForm.style.display = 'none';
}

// বিক্রয় মুছুন - উন্নত সংস্করণ
function deleteSale(index) {
    if(confirm(`আপনি কি এই বিক্রয় এন্ট্রি মুছে ফেলতে চান?`)) {
        const sale = sales[index];
        
        // পণ্য স্টক ফেরত দিন
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            product.stockBundles += sale.quantity;
            product.stockPieces += sale.quantity * product.piecesPerBundle;
        }
        
        // ক্রেতার তথ্য আপডেট করুন
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
            customer.totalPurchase -= sale.total;
            if (sale.paymentMethod === 'due') {
                customer.due -= sale.total;
            }
        }
        
        // নগদ বা ব্যাংক ব্যালেন্স আপডেট করুন
        if (sale.paymentMethod === 'cash') {
            cashBalance -= sale.total;
        } else if (sale.paymentMethod === 'bank') {
            const bank = banks.find(b => b.name === sale.bankName);
            if (bank) {
                bank.balance -= sale.total;
            }
        }
        
        sales.splice(index, 1);
        markDataChanged();
        saveAllData();
        
        alert('বিক্রয় সফলভাবে মুছে ফেলা হয়েছে!');
        refreshSalesTable();
        refreshProductTab();
        refreshCustomersTable();
        updateDashboard();
        refreshBankBalances();
    }
}

// ব্যাংক লেনদেন মুছুন - উন্নত সংস্করণ
function deleteBankTransaction(index) {
    if(confirm(`আপনি কি এই ব্যাংক লেনদেন মুছে ফেলতে চান?`)) {
        const transaction = bankTransactions[index];
        
        // ব্যাংক ব্যালেন্স আপডেট করুন
        const bank = banks.find(b => b.name === transaction.bankName);
        if (bank) {
            if (transaction.type === 'জমা') {
                bank.balance -= transaction.amount;
                cashBalance += transaction.amount; // ব্যাংক থেকে নগদ ফেরত
            } else if (transaction.type === 'উত্তোলন') {
                bank.balance += transaction.amount;
                cashBalance -= transaction.amount; // নগদ থেকে ব্যাংক ফেরত
            }
        }
        
        bankTransactions.splice(index, 1);
        markDataChanged();
        saveAllData();
        
        alert('ব্যাংক লেনদেন সফলভাবে মুছে ফেলা হয়েছে!');
        refreshBankTransactionsTable();
        refreshBankBalances();
        refreshTransactionsTable();
        updateDashboard();
    }
}

// লেনদেন মুছুন - উন্নত সংস্করণ
function deleteTransaction(index) {
    if(confirm(`আপনি কি এই লেনদেন মুছে ফেলতে চান?`)) {
        const transaction = transactions[index];
        
        // নগদ ব্যালেন্স আপডেট করুন
        if (transaction.type === 'নগদ জমা' || transaction.type === 'ক্রেতা পেমেন্ট') {
            cashBalance -= transaction.amount;
            
            // ক্রেতা পেমেন্ট হলে ক্রেতার বকেয়া ফেরত দিন
            if (transaction.type === 'ক্রেতা পেমেন্ট' && transaction.customerId) {
                const customer = customers.find(c => c.id === transaction.customerId);
                if (customer) {
                    customer.due += transaction.amount;
                }
            }
        } else if (transaction.type === 'নগদ উত্তোলন' || transaction.type === 'বেতন' || transaction.type === 'সাপ্লায়ার পেমেন্ট') {
            cashBalance += transaction.amount;
        }
        
        transactions.splice(index, 1);
        markDataChanged();
        saveAllData();
        
        alert('লেনদেন সফলভাবে মুছে ফেলা হয়েছে!');
        refreshTransactionsTable();
        refreshCustomersTable();
        updateDashboard();
    }
}

// হাজিরা এবং উৎপাদন ব্যবস্থাপনার জন্য ফাংশনগুলি
function refreshQuickAttendanceTable() {
    const table = document.getElementById('quick-attendance-table');
    table.innerHTML = '';
    
    if (workers.length === 0) {
        table.innerHTML = '<tr><td colspan="4" style="text-align: center;">কোন শ্রমিক ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    workers.forEach(worker => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${worker.id}</td>
            <td>${worker.name}</td>
            <td>${worker.category}</td>
            <td>
                <div class="attendance-buttons">
                    <button class="attendance-btn present-btn active" data-worker="${worker.id}" data-status="present">উপস্থিত</button>
                    <button class="attendance-btn absent-btn" data-worker="${worker.id}" data-status="absent">অনুপস্থিত</button>
                    <button class="attendance-btn leave-btn" data-worker="${worker.id}" data-status="leave">ছুটি</button>
                </div>
            </td>
        `;
        table.appendChild(row);
    });
    
    // হাজিরা বাটন ইভেন্ট যোগ করুন
    document.querySelectorAll('.attendance-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const workerId = this.getAttribute('data-worker');
            const status = this.getAttribute('data-status');
            
            // বর্তমান শ্রমিকের সকল বাটন রিসেট করুন
            document.querySelectorAll(`.attendance-btn[data-worker="${workerId}"]`).forEach(b => {
                b.classList.remove('active');
            });
            
            // নির্বাচিত বাটন সক্রিয় করুন
            this.classList.add('active');
        });
    });
}

function saveQuickAttendance() {
    const date = document.getElementById('quick-attendance-date').value;
    
    if (!date) {
        alert('তারিখ নির্বাচন করুন!');
        return;
    }
    
    let attendanceSaved = false;
    
    document.querySelectorAll('.attendance-buttons').forEach(buttons => {
        const workerId = buttons.querySelector('.attendance-btn').getAttribute('data-worker');
        const activeButton = buttons.querySelector('.attendance-btn.active');
        
        if (activeButton) {
            const status = activeButton.getAttribute('data-status');
            
            // বিদ্যমান এন্ট্রি চেক করুন
            const existingIndex = attendance.findIndex(a => a.date === date && a.workerId === workerId);
            
            if (existingIndex !== -1) {
                attendance[existingIndex].status = status;
            } else {
                attendance.push({
                    date: date,
                    workerId: workerId,
                    status: status
                });
            }
            
            attendanceSaved = true;
        }
    });
    
    if (attendanceSaved) {
        markDataChanged();
        saveAllData();
        alert('হাজিরা সফলভাবে সেভ করা হয়েছে!');
        refreshAttendanceTable();
    } else {
        alert('কোন হাজিরা ডেটা পাওয়া যায়নি!');
    }
}

function refreshAttendanceTable() {
    const table = document.getElementById('attendance-table');
    table.innerHTML = '';
    
    if (attendance.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">কোন হাজিরা ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    const filterDate = document.getElementById('filter-date').value;
    let filteredAttendance = attendance;
    
    if (filterDate) {
        filteredAttendance = attendance.filter(a => a.date === filterDate);
    }
    
    if (filteredAttendance.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">এই তারিখে কোন হাজিরা ডেটা পাওয়া যায়নি</td></tr>';
        return;
    }
    
    filteredAttendance.forEach((record, index) => {
        const worker = workers.find(w => w.id === record.workerId);
        
        if (worker) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${worker.id}</td>
                <td>${worker.name}</td>
                <td>${worker.category}</td>
                <td>${record.status}</td>
                <td class="action-buttons">
                    <button class="btn-danger" onclick="deleteAttendance(${index})">মুছুন</button>
                </td>
            `;
            table.appendChild(row);
        }
    });
}

function deleteAttendance(index) {
    if(confirm(`আপনি কি এই হাজিরা রেকর্ড মুছে ফেলতে চান?`)) {
        attendance.splice(index, 1);
        markDataChanged();
        saveAllData();
        alert('হাজিরা রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!');
        refreshAttendanceTable();
    }
}

// কাচামাল স্টক রিপোর্ট প্রিন্ট করুন
function printStockReport() {
    const stockReportContent = `
        <div class="salary-sheet">
            <div class="salary-header">
                <h3>Zafrul Metal</h3>
                <p>রংপুর রোড, বগুড়া</p>
                <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                <p>কাচামাল স্টক রিপোর্ট</p>
                <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
            </div>
            <div class="statement-summary">
                <div class="statement-summary-item">
                    <div class="statement-summary-label">এলুমিনিয়াম</div>
                    <div class="statement-summary-value">${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)} কেজি</div>
                </div>
                <div class="statement-summary-item">
                    <div class="statement-summary-label">স্টিল</div>
                    <div class="statement-summary-value">${rawMaterialStock['স্টিল'].toFixed(2)} কেজি</div>
                </div>
                <div class="statement-summary-item">
                    <div class="statement-summary-label">তামা</div>
                    <div class="statement-summary-value">${rawMaterialStock['তামা'].toFixed(2)} কেজি</div>
                </div>
                <div class="statement-summary-item">
                    <div class="statement-summary-label">মোট স্টক</div>
                    <div class="statement-summary-value">${(rawMaterialStock['এলুমিনিয়াম'] + rawMaterialStock['স্টিল'] + rawMaterialStock['তামা']).toFixed(2)} কেজি</div>
                </div>
            </div>
            <table class="salary-table stock-report-table">
                <thead>
                    <tr>
                        <th>কাচামালের ধরন</th>
                        <th>স্টক (কেজি)</th>
                        <th>স্টক অবস্থা</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>এলুমিনিয়াম</td>
                        <td>${rawMaterialStock['এলুমিনিয়াম'].toFixed(2)}</td>
                        <td>${rawMaterialStock['এলুমিনিয়াম'] < 100 ? 'নিম্ন' : rawMaterialStock['এলুমিনিয়াম'] < 500 ? 'মধ্যম' : 'পর্যাপ্ত'}</td>
                    </tr>
                    <tr>
                        <td>স্টিল</td>
                        <td>${rawMaterialStock['স্টিল'].toFixed(2)}</td>
                        <td>${rawMaterialStock['স্টিল'] < 50 ? 'নিম্ন' : rawMaterialStock['স্টিল'] < 200 ? 'মধ্যম' : 'পর্যাপ্ত'}</td>
                    </tr>
                    <tr>
                        <td>তামা</td>
                        <td>${rawMaterialStock['তামা'].toFixed(2)}</td>
                        <td>${rawMaterialStock['তামা'] < 20 ? 'নিম্ন' : rawMaterialStock['তামা'] < 100 ? 'মধ্যম' : 'পর্যাপ্ত'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>কাচামাল স্টক রিপোর্ট</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .salary-sheet { border: 1px solid #ddd; padding: 20px; }
                .salary-header { text-align: center; margin-bottom: 20px; }
                .salary-header h3 { font-size: 24px; margin-bottom: 10px; }
                .salary-header p { margin: 5px 0; }
                .statement-summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                .statement-summary-item { text-align: center; }
                .statement-summary-label { font-size: 14px; color: #666; }
                .statement-summary-value { font-size: 18px; font-weight: bold; color: #2c3e50; }
            </style>
        </head>
        <body>
            ${stockReportContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// বেতন ব্যবস্থাপনা ফাংশন - সংশোধিত
document.getElementById('salary-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateSalary();
});

function calculateSalary() {
    const period = document.getElementById('salary-period').value;
    const startDate = document.getElementById('salary-start-date').value;
    const endDate = document.getElementById('salary-end-date').value;
    
    if (!startDate || !endDate) {
        alert('শুরু এবং শেষ তারিখ নির্বাচন করুন!');
        return;
    }
    
    let salaryData = calculateAllSalaries(startDate, endDate);
    
    if (salaryData.length === 0) {
        alert('এই সময়কালে কোন বেতন ডেটা পাওয়া যায়নি');
        return;
    }
    
    displaySalarySheet(salaryData, startDate, endDate);
}

function displaySalarySheet(salaryData, startDate, endDate) {
    const salarySheet = document.getElementById('salary-sheet');
    salarySheet.innerHTML = '';
    
    let totalSalary = 0;
    let totalAdvance = 0;
    let totalPayable = 0;
    
    let html = `
        <div class="salary-sheet">
            <div class="salary-header">
                <h3>Zafrul Metal</h3>
                <p>রংপুর রোড, বগুড়া</p>
                <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                <p>বেতন স্টেটমেন্ট</p>
                <p>সময়কাল: ${startDate} থেকে ${endDate}</p>
            </div>
            <table class="salary-table">
                <thead>
                    <tr>
                        <th>শ্রমিক আইডি</th>
                        <th>নাম</th>
                        <th>বেতনের ধরন</th>
                        <th>মোট বেতন (৳)</th>
                        <th>অগ্রীম বেতন (৳)</th>
                        <th>পরিশোধযোগ্য (৳)</th>
                        <th>পরিশোধ অবস্থা</th>
                        <th>কার্যক্রম</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    salaryData.forEach(data => {
        const adjustment = adjustAdvanceSalary(data.workerId, data.salary, startDate, endDate);
        
        totalSalary += data.salary;
        totalAdvance += adjustment.advanceDeduction;
        totalPayable += adjustment.finalSalary;
        
        // পরিশোধিত কিনা চেক করুন
        const isPaid = salaryPayments.some(payment => 
            payment.workerId === data.workerId && 
            payment.amount === adjustment.finalSalary &&
            payment.date >= startDate && 
            payment.date <= endDate
        );
        
        const paymentStatus = isPaid ? 
            '<span style="color: green; font-weight: bold;">পরিশোধিত ✓</span>' : 
            '<span style="color: red;">বকেয়া</span>';
        
        const payButton = isPaid ? 
            '<button class="salary-payment-btn" disabled style="background-color: #95a5a6; cursor: not-allowed;">পরিশোধিত</button>' :
            `<button class="salary-payment-btn" onclick="paySalary('${data.workerId}', ${adjustment.finalSalary}, event)">পরিশোধ</button>`;
        
        html += `
            <tr>
                <td>${data.workerId}</td>
                <td>${data.workerName}</td>
                <td>${data.salaryType}</td>
                <td>৳ ${data.salary.toFixed(2)}</td>
                <td>৳ ${adjustment.advanceDeduction.toFixed(2)}</td>
                <td>৳ ${adjustment.finalSalary.toFixed(2)}</td>
                <td>${paymentStatus}</td>
                <td class="action-buttons">
                    ${payButton}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold;">মোট:</td>
                        <td style="font-weight: bold;">৳ ${totalSalary.toFixed(2)}</td>
                        <td style="font-weight: bold;">৳ ${totalAdvance.toFixed(2)}</td>
                        <td style="font-weight: bold;">৳ ${totalPayable.toFixed(2)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    salarySheet.innerHTML = html;
}

// পরিশোধ রসিদ প্রিন্ট করুন
function printPaymentReceipts() {
    const startDate = document.getElementById('salary-start-date').value;
    const endDate = document.getElementById('salary-end-date').value;
    
    if (!startDate || !endDate) {
        alert('শুরু এবং শেষ তারিখ নির্বাচন করুন!');
        return;
    }
    
    let salaryData = calculateAllSalaries(startDate, endDate);
    
    if (salaryData.length === 0) {
        alert('এই সময়কালে কোন বেতন ডেটা পাওয়া যায়নি');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>পরিশোধ রসিদ</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; page-break-after: always; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { font-size: 24px; margin-bottom: 5px; }
                .header p { margin: 3px 0; }
                .details { margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .signature { margin-top: 40px; text-align: center; }
            </style>
        </head>
        <body>
    `;
    
    salaryData.forEach(data => {
        const adjustment = adjustAdvanceSalary(data.workerId, data.salary, startDate, endDate);
        const worker = workers.find(w => w.id === data.workerId);
        
        if (worker && adjustment.finalSalary > 0) {
            printContent += `
                <div class="receipt">
                    <div class="header">
                        <h2>Zafrul Metal</h2>
                        <p>রংপুর রোড, বগুড়া</p>
                        <p>ফোন: ০১৭১৩৭০৬৯৯৬</p>
                        <h3>পরিশোধ রসিদ</h3>
                    </div>
                    <div class="details">
                        <div class="detail-row">
                            <span>তারিখ:</span>
                            <span>${new Date().toLocaleDateString('bn-BD')}</span>
                        </div>
                        <div class="detail-row">
                            <span>রসিদ নং:</span>
                            <span>${Date.now()}</span>
                        </div>
                        <div class="detail-row">
                            <span>শ্রমিক নাম:</span>
                            <span>${worker.name}</span>
                        </div>
                        <div class="detail-row">
                            <span>শ্রমিক আইডি:</span>
                            <span>${worker.id}</span>
                        </div>
                        <div class="detail-row">
                            <span>সময়কাল:</span>
                            <span>${startDate} থেকে ${endDate}</span>
                        </div>
                        <div class="detail-row">
                            <span>পরিশোধের ধরন:</span>
                            <span>বেতন</span>
                        </div>
                        <div class="detail-row">
                            <span>মোট বেতন:</span>
                            <span>৳ ${data.salary.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>অগ্রীম বেতন (বিয়োগ):</span>
                            <span>৳ ${adjustment.advanceDeduction.toFixed(2)}</span>
                        </div>
                        <div class="detail-row" style="font-weight: bold; font-size: 18px; margin-top: 20px;">
                            <span>পরিশোধ পরিমাণ:</span>
                            <span>৳ ${adjustment.finalSalary.toFixed(2)}</span>
                        </div>
                        <div class="detail-row" style="margin-top: 10px;">
                            <span>টাকার কথায়:</span>
                            <span>${convertToWords(adjustment.finalSalary)} টাকা</span>
                        </div>
                    </div>
                    <div class="signature">
                        <p>_________________________</p>
                        <p>প্রদানকারীর স্বাক্ষর</p>
                    </div>
                </div>
            `;
        }
    });
    
    printContent += `</body></html>`;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// রিপোর্ট ফাংশন
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const reportPeriod = document.getElementById('report-period').value;
    
    let startDate, endDate;
    
    if (reportPeriod === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            alert('শুরু এবং শেষ তারিখ নির্বাচন করুন!');
            return;
        }
    } else {
        const today = new Date();
        
        switch(reportPeriod) {
            case 'today':
                startDate = today.toISOString().split('T')[0];
                endDate = startDate;
                break;
            case 'week':
                startDate = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
                endDate = new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                break;
        }
    }
    
    let reportOutput = document.getElementById('report-output');
    reportOutput.innerHTML = `<h3>রিপোর্ট: ${reportType} (${startDate} থেকে ${endDate})</h3>`;
    
    switch(reportType) {
        case 'sales':
            generateSalesReport(startDate, endDate);
            break;
        case 'salary':
            generateSalaryReport(startDate, endDate);
            break;
        case 'attendance':
            generateAttendanceReport(startDate, endDate);
            break;
        case 'inventory':
            generateInventoryReport();
            break;
        case 'transactions':
            generateTransactionsReport(startDate, endDate);
            break;
        case 'raw-materials':
            generateRawMaterialsReport(startDate, endDate);
            break;
        case 'production':
            generateProductionReport(startDate, endDate);
            break;
        case 'cash-flow':
            generateCashFlowReport(startDate, endDate);
            break;
        case 'bank-statement':
            generateBankStatementReport(startDate, endDate);
            break;
    }
}

function generateSalesReport(startDate, endDate) {
    const filteredSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
    let totalSales = 0;
    let totalCash = 0;
    let totalBank = 0;
    let totalDue = 0;
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>ক্রেতা</th>
                    <th>পণ্য</th>
                    <th>পরিমাণ (বান্ডিল)</th>
                    <th>মূল্য (৳)</th>
                    <th>পেমেন্ট</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredSales.forEach(sale => {
        const customer = customers.find(c => c.id === sale.customerId);
        const product = products.find(p => p.id === sale.productId);
        
        html += `
            <tr>
                <td>${sale.date}</td>
                <td>${customer ? customer.name : sale.customerId}</td>
                <td>${product ? product.name : sale.productId}</td>
                <td>${sale.quantity.toFixed(2)}</td>
                <td>৳ ${sale.total.toFixed(2)}</td>
                <td>${sale.paymentMethod}</td>
            </tr>
        `;
        
        totalSales += sale.total;
        
        if (sale.paymentMethod === 'cash') totalCash += sale.total;
        else if (sale.paymentMethod === 'bank') totalBank += sale.total;
        else if (sale.paymentMethod === 'due') totalDue += sale.total;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right; font-weight: bold;">মোট:</td>
                    <td></td>
                    <td style="font-weight: bold;">৳ ${totalSales.toFixed(2)}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">নগদ:</td>
                    <td></td>
                    <td>৳ ${totalCash.toFixed(2)}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">ব্যাংক:</td>
                    <td></td>
                    <td>৳ ${totalBank.toFixed(2)}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">বাকি:</td>
                    <td></td>
                    <td>৳ ${totalDue.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateSalaryReport(startDate, endDate) {
    // বেতন রিপোর্ট জেনারেট করুন
    calculateSalary();
}

function generateAttendanceReport(startDate, endDate) {
    const filteredAttendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>শ্রমিক আইডি</th>
                    <th>নাম</th>
                    <th>শ্রেণী</th>
                    <th>হাজিরা</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredAttendance.forEach(record => {
        const worker = workers.find(w => w.id === record.workerId);
        
        if (worker) {
            html += `
                <tr>
                    <td>${record.date}</td>
                    <td>${worker.id}</td>
                    <td>${worker.name}</td>
                    <td>${worker.category}</td>
                    <td>${record.status}</td>
                </tr>
            `;
        }
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateInventoryReport() {
    let html = `
        <h4>পণ্য স্টক</h4>
        <table>
            <thead>
                <tr>
                    <th>পণ্য আইডি</th>
                    <th>নাম</th>
                    <th>স্টক (বান্ডিল)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach(product => {
        html += `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.stockBundles}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateTransactionsReport(startDate, endDate) {
    const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>ধরন</th>
                    <th>বিবরণ</th>
                    <th>পরিমাণ (৳)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredTransactions.forEach(transaction => {
        html += `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.type}</td>
                <td>${transaction.description}</td>
                <td>৳ ${transaction.amount.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateRawMaterialsReport(startDate, endDate) {
    const filteredMaterials = rawMaterials.filter(m => m.date >= startDate && m.date <= endDate);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>সাপ্লায়ার</th>
                    <th>কাচামালের ধরন</th>
                    <th>ওজন (কেজি)</th>
                    <th>মূল্য (৳)</th>
                    <th>পেমেন্ট</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredMaterials.forEach(material => {
        const supplier = suppliers.find(s => s.id === material.supplierId);
        
        html += `
            <tr>
                <td>${material.date}</td>
                <td>${supplier ? supplier.name : material.supplierId}</td>
                <td>${material.type}</td>
                <td>${material.weight.toFixed(2)}</td>
                <td>৳ ${material.total.toFixed(2)}</td>
                <td>${material.paymentMethod}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateProductionReport(startDate, endDate) {
    const filteredProductions = productions.filter(p => p.date >= startDate && p.date <= endDate);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>শ্রমিক</th>
                    <th>পণ্য</th>
                    <th>পণ্য সংখ্যা</th>
                    <th>ব্যবহৃত কাচামাল (কেজি)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredProductions.forEach(production => {
        const worker = workers.find(w => w.id === production.workerId);
        const product = products.find(p => p.id === production.productId);
        
        html += `
            <tr>
                <td>${production.date}</td>
                <td>${worker ? worker.name : production.workerId}</td>
                <td>${product ? product.name : production.productId}</td>
                <td>${production.quantity}</td>
                <td>${production.rawMaterialUsed.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateCashFlowReport(startDate, endDate) {
    let totalIncome = 0;
    let totalExpense = 0;
    
    // আয় গণনা (বিক্রয়)
    const filteredSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
    filteredSales.forEach(sale => {
        totalIncome += sale.total;
    });
    
    // ব্যয় গণনা (কাচামাল, বেতন, লেনদেন)
    const filteredMaterials = rawMaterials.filter(m => m.date >= startDate && m.date <= endDate);
    filteredMaterials.forEach(material => {
        totalExpense += material.total;
    });
    
    const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    filteredTransactions.forEach(transaction => {
        if (transaction.type === 'বেতন' || transaction.type === 'নগদ উত্তোলন') {
            totalExpense += transaction.amount;
        } else if (transaction.type === 'নগদ জমা') {
            totalIncome += transaction.amount;
        }
    });
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>বিবরণ</th>
                    <th>পরিমাণ (৳)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>মোট আয়</td>
                    <td>৳ ${totalIncome.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>মোট ব্যয়</td>
                    <td>৳ ${totalExpense.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>নিট নগদ প্রবাহ</td>
                    <td>৳ ${(totalIncome - totalExpense).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('report-output').innerHTML += html;
}

function generateBankStatementReport(startDate, endDate) {
    const filteredBankTransactions = bankTransactions.filter(t => t.date >= startDate && t.date <= endDate);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>ব্যাংক</th>
                    <th>ধরন</th>
                    <th>বিবরণ</th>
                    <th>পরিমাণ (৳)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredBankTransactions.forEach(transaction => {
        html += `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.bankName}</td>
                <td>${transaction.type}</td>
                <td>${transaction.description}</td>
                <td>৳ ${transaction.amount.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    document.getElementById('report-output').innerHTML += html;
}

function printReport() {
    window.print();
}

// কাস্টম তারিখ রেঞ্জ দেখান/লুকান
document.getElementById('report-period').addEventListener('change', function() {
    const customDateRange = document.getElementById('custom-date-range');
    if (this.value === 'custom') {
        customDateRange.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
    }
});

// পৃষ্ঠা লোড হলে লগইন মডেল দেখান
window.addEventListener('load', function() {
    document.getElementById('login-modal').classList.remove('hidden');
});