variable "iam_role_eks" {
   type = string
}

variable "environment" {
  type = string
}
variable "backup_policy" {
  type = string 
}

variable "velero_role" {
  type = string 
}


variable "bucket_name" {
  type = string 
}

variable "oidc_provider_arn" {
  type = string 
}
