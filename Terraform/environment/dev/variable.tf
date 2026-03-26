variable "environment" {
  type = string
  default = "dev"
}

variable "bucket_name" {
  type = string 
  default = "backup-bucket"
}

variable  "backup_policy" {
   type = string 
   default = "backup-bucket-policy"
}

variable "node_group_name" {
  type = string 
  default = "uber-eks-nodegroup"
}

variable "cluster_name" {
  type = string
  default  = "uber-eks-cluster"
}

variable "velero_role" {
  type = string
  default = "velero_role"
}

