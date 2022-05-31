const {MongoClient} = require ('mongodb')

async function main(){
    //connection url to connect with cluster
    const url = 'mongodb+srv://demo:demo@cluster0.e8bzf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

    //creating instance of mango client
    const client = new MongoClient(url)

    try{
        //connection cluster
        await client.connect()

        //displaying list of databases
        await listDatabases(client)
        
        await createListing(client, {
            name: 'jemmy',
            summary : 'Amazing Trip',
            bedrooms: 2,
            bathrooms: 2
        })

        await createMultipleListing(client, [
            {
                name: 'jemmy',
                summary : 'Amazing Trip', 
                bedrooms: 2,
                bathrooms: 2,
                beds: 4,
                last_date: new Date(), 
            },
            {
                name: 'John',
                summary : 'Suspecious house with proper airflow',
                property_type: 'House',
                bedrooms: 2,
                bathrooms: 2,
                beds: 4, 
            },
            {
                name: 'Licey',
                summary : 'Decent room', 
                bedrooms: 1,
                bathrooms: 1,
                beds: 2,
                last_date: new Date(),
            }

        ])

        await findOneListingByName(client, 'jemmy')

        await findListingsWithMinimunBedroomsBathroomsAndRecentReviews(client, {
            minimunNumberOfBedrooms: 4,
            minimunNumberOfBathrooms: 2,
            maximunNumberOfResult: 5
        })

        await updateListingByName(client, 'jemmy', {bedrooms: 4, beds: 6})

        await upsertListingByName(client, 'jemmy', {name: 'jemmy', bedrooms: 3, bathrooms:3})

        await updateAllListingHavingPropertyType (client)

        await deleteListingByName (client, 'jemmy')

        await deleteListingsBeforeScarpedDate(client, new Date("2019-02-15"))

    }catch (e){
        console.log(e)
    }finally{
        await client.close()
    }
}
main().catch(console.error)

async function listDatabases (client){
    const databasesList = await client.db().admin().listDatabases()
    console.log("Databases List:")
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`)
    })
}

//create
async function createListing (client, newListing){
    const result = await client.db('sample_airbnb').collection("listingsAndReviews").insertOne(newListing)
    console.log(`new listing with following id: ${result.insertedId}`)
}

async function createMultipleListing(client, newListings){
    const result = await client.db('sample-airbnb').collection('listingsAndReviews').insertMany(newListings)
    console.log(`${result.insertedCount} new listing created with following ids: `)
    console.log(result.insertedIds)
}

//read
async function findOneListingByName(client, nameOfListing){
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').findOne({name: nameOfListing})
    if(result){
        console.log(`found a listing in collection with name: ${nameOfListing}`)
        console.log(result)
    }else{
        console.log(`no listing found in collection with name: ${nameOfListing}`)
    }
    console.log()
}

async function findListingsWithMinimunBedroomsBathroomsAndRecentReviews(
    client, {
        minimunNumberOfBedrooms = 0,
        minimunNumberOfBathrooms = 0,
        maximunNumberOfResult = Number.MAX_SAFE_INTEGER
    } = {}){
    const cursor = client.db('sample_airbnb').collection('listingsAndReviews').find({
        bedrooms: { $gte: minimunNumberOfBedrooms},
        bathrooms: { $gte: minimunNumberOfBathrooms}
    }).sort({last_review: -1}).limit(maximunNumberOfResult)
    const results = await cursor.toArray()

    if(results.length > 0){
        console.log(`found listings with atleast ${minimunNumberOfBedrooms} bedrooms and ${minimunNumberOfBathrooms} bathrooms: `)
        results.forEach((result, i) => {
            date =new Date(result.last_review).toDateString()
            console.log()
            console.log(`${i+1}.name: ${result.name}`)
            console.log(`_id: ${result._id}`)
            console.log(`bedrooms: ${result.bedrooms}`)
            console.log(`bathrooms: ${result.bethrooms}`)
            console.log(`most recent reviews date: ${new Date(result.last_review).toDateString()}`)
        })
    }else{
        console.log(`no listing found with atleast ${minimunNumberOfBedrooms} bedrooms and ${minimunNumberOfBathrooms} bathrooms`)
    }
}

//update
async function updateListingByName (client, nameOfListing, updatedListing){
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').updateOne({name: nameOfListing},{$set: updatedListing})
    console.log(`${result.matchedCount} document(s) matched the query requirment`)
    console.log(`${result.modifiedCount} document(s) was/were updated`)
}

async function upsertListingByName(client, nameOfListing, updatedListing)
{
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').updateOne({name: nameOfListing}, {$set: updatedListing}, {$upsert:true})
    console.log(`${result.matchedCount} document(s) matched the query requirments`)
    if(result.upsertedCount > 0){
        console.log(`one document was inserted with id: ${result.upsertedId}`)
    }else{
        console.log(`${result.modifiedCount} document(s) was/were updated`)
    }
}

async function updateAllListingHavingPropertyType(client){
    const result = await client.db('sample-airbnb').collection('listingsAndReviews').updateMany(
        {property_type: {$exists: false}}, //property_type does not exists in documents
        {$set: {property_type: 'unknown'}} 
    )
    console.log(`${result.matchedCount} documents was/were matched the query criteria`)
    console.log(`${result.modifiedCount} documents was/were updated from the listing`)
}

//detele
async function deleteListingByName(client, nameOfListing){
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').deleteOne({name: nameOfListing})
    console.log(`${result.deletedCount} was/were deleted`)
}

async function deleteListingsBeforeScarpedDate(client, date){
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').deleteMany({"last_scraped": {$lt: date}})
    console.log(`${result.deletedCount} was/were deleted`)
}