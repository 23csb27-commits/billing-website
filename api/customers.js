const { salesforceRequest } = require("../lib/salesforce");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const query = `
        SELECT Id, Name, Customer_Name__c, Email__c, Phone__c, Address__c, GST_Number__c, Status__c
        FROM Customer__c
        ORDER BY CreatedDate DESC
        LIMIT 50
      `;

      const data = await salesforceRequest(
        `/query?q=${encodeURIComponent(query)}`
      );

      return res.status(200).json(data.records);
    }

    if (req.method === "POST") {
      const body = req.body;

      const data = await salesforceRequest("/sobjects/Customer__c/", {
        method: "POST",
        body: JSON.stringify({
          Name: body.customerName,
          Customer_Name__c: body.customerName,
          Email__c: body.email,
          Phone__c: body.phone,
          Address__c: body.address,
          GST_Number__c: body.gstNumber,
          Status__c: body.status || "Active"
        })
      });

      return res.status(201).json(data);
    }

    return res.status(405).json({
      message: "Method not allowed"
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};