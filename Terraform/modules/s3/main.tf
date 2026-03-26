resource "aws_s3_bucket" "source_bucket" {
 bucket = "velero-backup-bucket" 

 tags = {
   Name = var.bucket_name 
    environment  = var.environment
 }
}

resource "aws_s3_bucket_versioning" "source_bucket_versioning" {
   bucket = aws_s3_bucket.source_bucket.id 

   versioning_configuration {
     status = "Enabled"
   }
}
resource "aws_s3_bucket_public_access_block" "private_source_bucket_versioning" {
     bucket = aws_s3_bucket.source_bucket.id 

     block_public_acls = true
     block_public_policy = true 
     ignore_public_acls = true
     restrict_public_buckets = true 
}

resource "aws_s3_bucket_server_side_encryption_configuration" "source_bucket_encryption" {
   bucket = aws_s3_bucket.source_bucket.id 

   rule {
    apply_server_side_encryption_by_default {
      sse_algorithm ="AES256"
    }
   }
}

resource "aws_s3_bucket" "source_replica_bucket" {
   bucket = "source-replica-bucket"

  tags = {
    Name = var.source_replica_bucket_name
    environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "source_replica_bucket_versioning" {
   bucket = aws_s3_bucket.source_replica_bucket.id 

   versioning_configuration { 
    status = "Enabled"
   }
}

resource "aws_s3_bucket_public_access_block" "private_source_replica_bucket_versioning" {
   bucket = aws_s3_bucket.source_replica_bucket.id 

   block_public_acls = true 
   block_public_policy = true 
   restrict_public_buckets = true 
   ignore_public_acls = true 
}

resource "aws_s3_bucket_replication_configuration" "bucket_replication" {
    bucket = aws_s3_bucket.source_bucket.id 
    role =  var.velero_role_arn
    depends_on = [ 
        aws_s3_bucket_versioning.source_bucket_versioning ,
        aws_s3_bucket_versioning.source_replica_bucket_versioning 
     ]
  
  rule {
    id     = "replication-rule"
    status = "Enabled"
  
   destination {
    bucket        = aws_s3_bucket.source_replica_bucket.arn
    storage_class = "STANDARD"
  }

}

}